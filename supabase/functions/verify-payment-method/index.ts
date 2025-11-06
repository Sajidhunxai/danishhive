import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting payment verification");

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) {
      throw new Error("MOLLIE_API_KEY is not configured");
    }

    // Create Supabase client with service role key for database updates
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("full_name, payment_verified, mollie_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    if (profile.payment_verified) {
      logStep("User already payment verified");
      return new Response(JSON.stringify({ 
        success: true, 
        already_verified: true,
        message: "Payment method already verified" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create or get Mollie customer
    let mollieCustomerId = profile.mollie_customer_id;
    
    if (!mollieCustomerId) {
      logStep("Creating new Mollie customer");
      const customerResponse = await fetch("https://api.mollie.com/v2/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mollieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.full_name || "Client",
          email: user.email,
          metadata: {
            user_id: user.id,
            verification_purpose: true
          }
        }),
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.text();
        throw new Error(`Failed to create Mollie customer: ${error}`);
      }

      const customer = await customerResponse.json();
      mollieCustomerId = customer.id;
      logStep("Mollie customer created", { customerId: mollieCustomerId });

      // Update profile with customer ID
      await supabaseService
        .from("profiles")
        .update({ mollie_customer_id: mollieCustomerId })
        .eq("user_id", user.id);
    }

    // Create payment for verification (€0.01)
    logStep("Creating verification payment");
    const paymentResponse = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency: "EUR",
          value: "0.01"
        },
        customerId: mollieCustomerId,
        description: "Payment method verification - will be refunded",
        redirectUrl: `${req.headers.get("origin")}/complete-profile?payment_verified=success`,
        webhookUrl: `${req.headers.get("origin")}/webhook/mollie-verification`,
        metadata: {
          user_id: user.id,
          verification: true,
          refund_immediately: true
        }
      }),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Failed to create verification payment: ${error}`);
    }

    const payment = await paymentResponse.json();
    logStep("Verification payment created", { paymentId: payment.id, checkoutUrl: payment._links.checkout.href });

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      checkout_url: payment._links.checkout.href,
      message: "Payment verification initiated. You will be charged €0.01 which will be refunded immediately."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment-method", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});