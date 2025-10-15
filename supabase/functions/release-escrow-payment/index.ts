import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RELEASE-ESCROW-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting escrow payment release");

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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get contract details
    const { data: contract, error: contractError } = await supabaseService
      .from("contracts")
      .select(`
        *,
        jobs (
          title,
          client_id,
          freelancer_id
        )
      `)
      .eq("id", contract_id)
      .single();

    if (contractError) throw new Error(`Contract error: ${contractError.message}`);
    if (!contract) throw new Error("Contract not found");

    // Verify user is the client (only client can release escrow)
    if (contract.client_id !== user.id) {
      throw new Error("Unauthorized: Only the client can release escrow payments");
    }

    // Check if escrow payment exists
    const escrowPaymentId = contract.metadata?.escrow_payment_id;
    if (!escrowPaymentId) {
      throw new Error("No escrow payment found for this contract");
    }

    // Check escrow status
    if (contract.metadata?.escrow_status === 'released') {
      throw new Error("Escrow payment has already been released");
    }

    // Verify payment was completed
    logStep("Checking escrow payment status", { paymentId: escrowPaymentId });
    const paymentResponse = await fetch(`https://api.mollie.com/v2/payments/${escrowPaymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mollieApiKey}`,
      },
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Failed to fetch payment: ${error}`);
    }

    const payment = await paymentResponse.json();
    logStep("Payment status retrieved", { status: payment.status });

    if (payment.status !== "paid") {
      throw new Error(`Cannot release escrow: Payment status is ${payment.status}, must be 'paid'`);
    }

    // Get freelancer profile for payout
    const { data: freelancerProfile, error: freelancerError } = await supabaseService
      .from("profiles")
      .select("full_name, paypal_email, iban, bank_name, account_holder_name")
      .eq("user_id", contract.freelancer_id)
      .single();

    if (freelancerError) throw new Error(`Freelancer profile error: ${freelancerError.message}`);

    // For now, we'll just mark the escrow as released and create an earning record
    // In a production system, you'd integrate with Mollie's payout API or transfer to freelancer's account
    
    // Create earning record for freelancer (only the freelancer amount, not including platform fee)
    const { error: earningError } = await supabaseService
      .from("earnings")
      .insert({
        user_id: contract.freelancer_id,
        amount: contract.total_amount, // Freelancer gets the contract amount
        currency: 'EUR',
        status: 'completed',
        description: `Payment released from escrow for contract ${contract.contract_number}`,
        mollie_payment_id: escrowPaymentId
      });

    if (earningError) throw new Error(`Failed to create earning record: ${earningError.message}`);

    // Get client's fee rate for platform revenue calculation
    const { data: clientProfile, error: clientProfileError } = await supabaseService
      .from("profiles")
      .select("platform_fee_rate, reduced_fee_until")
      .eq("user_id", contract.client_id)
      .single();

    let feeRate = 0.15; // Default 15%
    
    if (!clientProfileError && clientProfile.platform_fee_rate && clientProfile.reduced_fee_until) {
      const reducedFeeExpiry = new Date(clientProfile.reduced_fee_until);
      const now = new Date();
      
      // Use reduced fee if still valid
      if (reducedFeeExpiry > now) {
        feeRate = clientProfile.platform_fee_rate;
      }
    }

    // Create platform revenue record with actual fee rate used
    const platformFee = contract.total_amount * feeRate;
    const { error: revenueError } = await supabaseService
      .from("earnings")
      .insert({
        user_id: null, // Platform revenue, not user-specific
        amount: platformFee,
        currency: 'EUR',
        status: 'completed',
        description: `Platform fee (${(feeRate * 100).toFixed(0)}%) for contract ${contract.contract_number}`,
        mollie_payment_id: escrowPaymentId
      });

    if (revenueError) {
      // Log error but don't fail the entire operation
      logStep("Warning: Failed to create platform revenue record", revenueError);
    }

    // Update contract metadata to mark escrow as released
    const updatedMetadata = {
      ...contract.metadata,
      escrow_status: 'released',
      escrow_released_at: new Date().toISOString(),
      escrow_released_by: user.id
    };

    await supabaseService
      .from("contracts")
      .update({ 
        metadata: updatedMetadata,
        status: 'completed' // Mark contract as completed when payment is released
      })
      .eq("id", contract_id);

    // Update job status to completed
    await supabaseService
      .from("jobs")
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq("id", contract.job_id);

    logStep("Escrow payment released successfully");

    return new Response(JSON.stringify({
      success: true,
      contract_id: contract_id,
      amount_released: contract.total_amount,
      freelancer_earning_created: true,
      message: `Escrow payment of €${contract.total_amount.toFixed(2)} has been released to freelancer (total client payment: €${(contract.total_amount * (1 + feeRate)).toFixed(2)} including ${(feeRate * 100).toFixed(0)}% platform fee)`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in release-escrow-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});