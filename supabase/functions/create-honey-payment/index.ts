import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-HONEY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting honey drops payment creation");

    const { package: honeyPackage } = await req.json();
    if (!honeyPackage || !honeyPackage.drops || !honeyPackage.price) {
      throw new Error("Invalid honey package data");
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

    // Get user profile for Mollie customer
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("full_name, mollie_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    if (!profile.mollie_customer_id) {
      throw new Error("Mollie customer ID not found. Please verify your payment method first.");
    }

    const totalDrops = honeyPackage.drops + (honeyPackage.bonus || 0);

    // Create honey payment with Mollie
    logStep("Creating honey payment", { 
      drops: totalDrops, 
      price: honeyPackage.price 
    });
    
    const paymentResponse = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency: "EUR",
          value: honeyPackage.price.toFixed(2)
        },
        customerId: profile.mollie_customer_id,
        description: `Køb af ${totalDrops} honningdråber (${honeyPackage.drops} + ${honeyPackage.bonus || 0} bonus)`,
        redirectUrl: `${req.headers.get("origin")}/profile?payment_success=true&honey_drops=${totalDrops}`,
        webhookUrl: `${req.headers.get("origin")}/api/webhook/honey-payment`,
        metadata: {
          user_id: user.id,
          honey_drops: totalDrops,
          base_drops: honeyPackage.drops,
          bonus_drops: honeyPackage.bonus || 0,
          purpose: "honey_purchase"
        }
      }),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Failed to create honey payment: ${error}`);
    }

    const payment = await paymentResponse.json();
    logStep("Honey payment created", { paymentId: payment.id });

    // Store pending honey purchase
    const { error: purchaseError } = await supabaseService
      .from("honey_purchases")
      .insert({
        user_id: user.id,
        mollie_payment_id: payment.id,
        drops_purchased: totalDrops,
        price_paid: honeyPackage.price,
        status: 'pending'
      });

    if (purchaseError) {
      logStep("Warning: Failed to store honey purchase record", purchaseError);
    }

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      checkout_url: payment._links.checkout.href,
      honey_drops: totalDrops,
      message: `Betaling oprettet for ${totalDrops} honningdråber (${honeyPackage.price} kr)`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-honey-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});