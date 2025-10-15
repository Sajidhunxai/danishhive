import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ESCROW-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting escrow payment creation");

    const { contract_id } = await req.json();
    if (!contract_id) {
      throw new Error("Contract ID is required");
    }

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) {
      throw new Error("MOLLIE_API_KEY is not configured");
    }

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    // Get contract details
    const { data: contract, error: contractError } = await supabaseService
      .from("contracts")
      .select(`
        *,
        jobs (
          title,
          client_id
        )
      `)
      .eq("id", contract_id)
      .single();

    if (contractError) throw new Error(`Contract error: ${contractError.message}`);
    if (!contract) throw new Error("Contract not found");

    // Verify user is the client
    if (contract.client_id !== user.id) {
      throw new Error("Unauthorized: Only the client can create escrow payments");
    }

    // Check if contract is fully signed
    if (!contract.client_signature_date || !contract.freelancer_signature_date) {
      throw new Error("Contract must be fully signed before creating escrow payment");
    }

    // Check if escrow payment already exists
    if (contract.metadata?.escrow_payment_id) {
      throw new Error("Escrow payment already exists for this contract");
    }

    // Get client profile for Mollie customer
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("full_name, mollie_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    if (!profile.mollie_customer_id) {
      throw new Error("Mollie customer ID not found. Please verify your payment method first.");
    }

      // Get client's current fee rate
      const { data: clientProfile, error: clientProfileError } = await supabaseService
        .from("profiles")
        .select("platform_fee_rate, reduced_fee_until")
        .eq("user_id", user.id)
        .single();

      if (clientProfileError) throw clientProfileError;

      // Determine the fee rate to use
      let feeRate = 0.15; // Default 15%
      
      if (clientProfile.platform_fee_rate && clientProfile.reduced_fee_until) {
        const reducedFeeExpiry = new Date(clientProfile.reduced_fee_until);
        const now = new Date();
        
        // Use reduced fee if still valid
        if (reducedFeeExpiry > now) {
          feeRate = clientProfile.platform_fee_rate;
        }
      }

      // Calculate escrow amount (contract total amount + platform fee)
      const freelancerAmount = contract.total_amount;
      const platformFee = freelancerAmount * feeRate;
      const escrowAmount = freelancerAmount + platformFee;
      
      if (!freelancerAmount || freelancerAmount <= 0) {
        throw new Error("Invalid contract amount for escrow payment");
      }

    // Create escrow payment with Mollie
    logStep("Creating escrow payment", { amount: escrowAmount });
    const paymentResponse = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency: "EUR",
          value: escrowAmount.toFixed(2)
        },
        customerId: profile.mollie_customer_id,
        description: `Escrow payment for contract ${contract.contract_number} (€${freelancerAmount.toFixed(2)} + €${platformFee.toFixed(2)} platform fee - ${(feeRate * 100).toFixed(0)}%)`,
        redirectUrl: `${req.headers.get("origin")}/contracts?payment_success=true&contract_id=${contract_id}`,
        webhookUrl: `${req.headers.get("origin")}/api/webhook/escrow-payment`,
        metadata: {
          contract_id: contract_id,
          client_id: user.id,
          escrow: true,
          purpose: "contract_escrow"
        }
      }),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Failed to create escrow payment: ${error}`);
    }

    const payment = await paymentResponse.json();
    logStep("Escrow payment created", { paymentId: payment.id });

    // Update contract with escrow payment information
    const updatedMetadata = {
      ...contract.metadata,
      escrow_payment_id: payment.id,
      escrow_amount: escrowAmount,
      escrow_status: 'pending'
    };

    await supabaseService
      .from("contracts")
      .update({ metadata: updatedMetadata })
      .eq("id", contract_id);

    logStep("Contract updated with escrow payment info");

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      checkout_url: payment._links.checkout.href,
      escrow_amount: escrowAmount,
      message: `Escrow payment of €${escrowAmount.toFixed(2)} created for contract ${contract.contract_number} (€${freelancerAmount.toFixed(2)} to freelancer + €${platformFee.toFixed(2)} platform fee - ${(feeRate * 100).toFixed(0)}%)`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-escrow-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});