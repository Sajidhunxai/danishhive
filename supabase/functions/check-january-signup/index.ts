import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-JANUARY-SIGNUP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Checking for January 2026 signup");

    const { user_id, role } = await req.json();
    if (!user_id || !role) {
      throw new Error("User ID and role are required");
    }

    // Only apply to clients
    if (role !== 'client') {
      return new Response(JSON.stringify({
        applied: false,
        message: "Special offer only applies to clients"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user signed up in January 2026
    const now = new Date();
    const isJanuary2026 = now.getFullYear() === 2026 && now.getMonth() === 0; // January is month 0

    if (!isJanuary2026) {
      logStep("Not January 2026, no special offer");
      return new Response(JSON.stringify({
        applied: false,
        message: "Special January 2026 offer not active"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get user's profile to check if already has reduced fee
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("platform_fee_rate, reduced_fee_until, created_at")
      .eq("user_id", user_id)
      .single();

    if (profileError) throw profileError;

    // Check if user already has a reduced fee
    if (profile.platform_fee_rate === 0.08 || profile.reduced_fee_until) {
      logStep("User already has reduced fee");
      return new Response(JSON.stringify({
        applied: false,
        message: "User already has special pricing"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Apply the January 2026 special offer - 8% fee for 6 months
    const reducedFeeUntil = new Date();
    reducedFeeUntil.setMonth(reducedFeeUntil.getMonth() + 6); // 6 months from now

    // Update user's fee rate
    const { error: updateError } = await supabaseService
      .from("profiles")
      .update({ 
        platform_fee_rate: 0.08, // 8% fee
        reduced_fee_until: reducedFeeUntil.toISOString()
      })
      .eq("user_id", user_id);

    if (updateError) throw updateError;

    logStep("January 2026 special offer applied", { 
      user_id, 
      new_fee_rate: 0.08,
      valid_until: reducedFeeUntil.toISOString()
    });

    return new Response(JSON.stringify({
      applied: true,
      fee_rate: 0.08,
      valid_until: reducedFeeUntil.toISOString(),
      message: "🎉 Velkommen! Som ny kunde i januar 2026 får du kun 8% gebyr i 6 måneder!"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-january-signup", { message: errorMessage });
    return new Response(JSON.stringify({ 
      applied: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});