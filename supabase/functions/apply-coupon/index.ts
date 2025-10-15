import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPLY-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting coupon application");

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

    logStep("Processing coupon", { coupon_code, user_id });

    // Check if it's the DanishHive25 coupon
    if (coupon_code !== "DANISHHIVE25") {
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
      .from("coupon_usage")
      .select("*")
      .eq("user_id", user_id)
      .eq("coupon_code", coupon_code)
      .maybeSingle();

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
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

    // Check total usage count (limit to first 150 users)
    const { count: totalUsage, error: countError } = await supabaseService
      .from("coupon_usage")
      .select("*", { count: 'exact', head: true })
      .eq("coupon_code", coupon_code);

    if (countError) throw countError;

    if ((totalUsage || 0) >= 150) {
      return new Response(JSON.stringify({
        success: false,
        message: "Kuponen er udløbet - begrænsning på 150 brugere nået"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify user is a freelancer
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("role, total_earnings")
      .eq("user_id", user_id)
      .single();

    if (profileError) throw profileError;

    if (profile.role !== 'freelancer') {
      return new Response(JSON.stringify({
        success: false,
        message: "Kun freelancers kan bruge denne kupon"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Apply the coupon - give 120 honey drops
    const honeyDropsToAdd = 120;
    const newTotal = (profile.total_earnings || 0) + honeyDropsToAdd;

    // Update user's honey drops
    const { error: updateError } = await supabaseService
      .from("profiles")
      .update({ total_earnings: newTotal })
      .eq("user_id", user_id);

    if (updateError) throw updateError;

    // Record coupon usage
    const { error: recordError } = await supabaseService
      .from("coupon_usage")
      .insert({
        user_id: user_id,
        coupon_code: coupon_code,
        honey_drops_granted: honeyDropsToAdd,
        used_at: new Date().toISOString()
      });

    if (recordError) {
      // Try to revert the honey drops update if recording fails
      await supabaseService
        .from("profiles")
        .update({ total_earnings: profile.total_earnings })
        .eq("user_id", user_id);
      
      throw recordError;
    }

    logStep("Coupon applied successfully", { 
      user_id, 
      honey_drops_added: honeyDropsToAdd,
      new_total: newTotal,
      usage_count: (totalUsage || 0) + 1
    });

    return new Response(JSON.stringify({
      success: true,
      honey_drops: honeyDropsToAdd,
      new_total: newTotal,
      remaining_uses: 150 - (totalUsage || 0) - 1,
      message: `🎉 Tillykke! Du har fået ${honeyDropsToAdd} gratis honningdråber!`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in apply-coupon", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});