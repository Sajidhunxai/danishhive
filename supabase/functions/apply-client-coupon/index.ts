import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPLY-CLIENT-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting client coupon application");

    const { coupon_code, user_id } = await req.json();
    if (!coupon_code || !user_id) {
      throw new Error("Coupon code and user ID are required");
    }

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Processing client coupon", { coupon_code, user_id });

    // Check if it's the FreelanceHive26 coupon
    if (coupon_code !== "FREELANCEHIVE26") {
      return new Response(JSON.stringify({
        success: false,
        message: "Ugyldig kuponkode"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user has already used this coupon
    const { data: existingUsage, error: usageError } = await supabaseService
      .from("client_coupon_usage")
      .select("*")
      .eq("user_id", user_id)
      .eq("coupon_code", coupon_code)
      .maybeSingle();

    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }

    if (existingUsage) {
      return new Response(JSON.stringify({
        success: false,
        message: "Du har allerede brugt denne kupon"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify user is a client
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("role, platform_fee_rate, reduced_fee_until")
      .eq("user_id", user_id)
      .single();

    if (profileError) throw profileError;

    if (profile.role !== 'client') {
      return new Response(JSON.stringify({
        success: false,
        message: "Kun kunder kan bruge denne kupon"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Apply the coupon - 8% fee for 12 months
    const reducedFeeUntil = new Date();
    reducedFeeUntil.setMonth(reducedFeeUntil.getMonth() + 12); // 12 months from now

    // Update user's fee rate
    const { error: updateError } = await supabaseService
      .from("profiles")
      .update({ 
        platform_fee_rate: 0.08, // 8% fee
        reduced_fee_until: reducedFeeUntil.toISOString()
      })
      .eq("user_id", user_id);

    if (updateError) throw updateError;

    // Record coupon usage
    const { error: recordError } = await supabaseService
      .from("client_coupon_usage")
      .insert({
        user_id: user_id,
        coupon_code: coupon_code,
        fee_rate_applied: 0.08,
        valid_until: reducedFeeUntil.toISOString(),
        used_at: new Date().toISOString()
      });

    if (recordError) {
      // Try to revert the fee update if recording fails
      await supabaseService
        .from("profiles")
        .update({ 
          platform_fee_rate: 0.15,
          reduced_fee_until: null
        })
        .eq("user_id", user_id);
      
      throw recordError;
    }

    logStep("Client coupon applied successfully", { 
      user_id, 
      new_fee_rate: 0.08,
      valid_until: reducedFeeUntil.toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      fee_rate: 0.08,
      valid_until: reducedFeeUntil.toISOString(),
      savings_percentage: 46.7, // (15% - 8%) / 15% = 46.7% savings
      message: `🎉 Fantastisk! Du har nu kun 8% gebyr i 12 måneder (i stedet for 15%)!`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in apply-client-coupon", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});