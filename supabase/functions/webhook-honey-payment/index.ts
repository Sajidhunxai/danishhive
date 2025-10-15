import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-HONEY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Processing honey payment webhook");

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) {
      throw new Error("MOLLIE_API_KEY is not configured");
    }

    // Get payment ID from request body
    const webhookData = await req.json();
    const paymentId = webhookData.id;

    if (!paymentId) {
      throw new Error("No payment ID provided in webhook");
    }

    logStep("Processing payment", { paymentId });

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch payment details from Mollie
    const paymentResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
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
    logStep("Payment details fetched", { status: payment.status, metadata: payment.metadata });

    // Only process paid payments
    if (payment.status !== "paid") {
      logStep("Payment not completed, skipping", { status: payment.status });
      return new Response(JSON.stringify({ message: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify this is a honey purchase
    if (payment.metadata?.purpose !== "honey_purchase") {
      logStep("Not a honey purchase, skipping");
      return new Response(JSON.stringify({ message: "Not a honey purchase" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = payment.metadata.user_id;
    const honeyDrops = parseInt(payment.metadata.honey_drops || "0");

    if (!userId || honeyDrops <= 0) {
      throw new Error("Invalid payment metadata");
    }

    // Update user's honey drops (using total_earnings temporarily)
    const { data: currentProfile, error: fetchError } = await supabaseService
      .from("profiles")
      .select("total_earnings")
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;

    const newTotal = (currentProfile?.total_earnings || 0) + honeyDrops;

    const { error: updateError } = await supabaseService
      .from("profiles")
      .update({ total_earnings: newTotal })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Update honey purchase record
    const { error: purchaseUpdateError } = await supabaseService
      .from("honey_purchases")
      .update({ status: 'completed' })
      .eq("mollie_payment_id", paymentId);

    if (purchaseUpdateError) {
      logStep("Warning: Failed to update honey purchase record", purchaseUpdateError);
    }

    logStep("Honey drops added successfully", { 
      userId, 
      honeyDropsAdded: honeyDrops,
      newTotal 
    });

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      honey_drops_added: honeyDrops,
      new_total: newTotal,
      message: `${honeyDrops} honningdråber tilføjet til bruger ${userId}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook-honey-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});