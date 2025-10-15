import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PAYMENT-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Checking payment status");

    const { payment_id } = await req.json();
    if (!payment_id) {
      throw new Error("Payment ID is required");
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

    // Check payment status with Mollie
    logStep("Fetching payment from Mollie", { paymentId: payment_id });
    const paymentResponse = await fetch(`https://api.mollie.com/v2/payments/${payment_id}`, {
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
    logStep("Payment status from Mollie", { status: payment.status, id: payment.id });

    if (payment.status === "paid") {
      // Update user profile to mark payment as verified
      await supabaseService
        .from("profiles")
        .update({
          payment_verified: true,
          payment_method_verified: true,
          payment_verification_date: new Date().toISOString()
        })
        .eq("user_id", user.id);

      logStep("User payment verification updated in database");

      // Auto-refund the verification payment
      if (payment.metadata?.refund_immediately) {
        logStep("Initiating automatic refund");
        const refundResponse = await fetch(`https://api.mollie.com/v2/payments/${payment_id}/refunds`, {
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
            description: "Automatic refund for payment verification"
          }),
        });

        if (refundResponse.ok) {
          logStep("Refund initiated successfully");
        } else {
          logStep("Refund failed, but verification completed");
        }
      }

      return new Response(JSON.stringify({
        success: true,
        verified: true,
        payment_status: payment.status,
        message: "Payment method verified successfully! The verification charge has been refunded."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      verified: false,
      payment_status: payment.status,
      message: `Payment status: ${payment.status}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-payment-status", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});