import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-GENERATE-COUPONS] ${step}${detailsStr}`);
};

// Generate random coupon code
const generateCouponCode = (prefix: string = '', length: number = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  const remainingLength = length - prefix.length;
  
  for (let i = 0; i < remainingLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting coupon generation");

    const {
      quantity,
      type, // 'freelancer' | 'client'
      benefit_type, // 'honey_drops' | 'fee_reduction'
      honey_drops_amount,
      fee_rate,
      max_uses_per_code,
      expires_in_days,
      code_prefix
    } = await req.json();

    if (!quantity || !type || !benefit_type) {
      throw new Error("Missing required parameters");
    }

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Verify admin access
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("is_admin, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    logStep("Admin verified, generating coupons", { 
      quantity, 
      type, 
      benefit_type,
      admin_id: user.id 
    });

    // Calculate expiry date
    const expiresAt = expires_in_days ? new Date() : null;
    if (expiresAt) {
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }

    // Generate coupon codes
    const couponsToInsert = [];
    const generatedCodes = new Set();

    for (let i = 0; i < quantity; i++) {
      let code;
      let attempts = 0;
      
      // Ensure unique codes
      do {
        code = generateCouponCode(code_prefix, 12);
        attempts++;
        if (attempts > 100) {
          throw new Error("Unable to generate unique coupon codes");
        }
      } while (generatedCodes.has(code));
      
      generatedCodes.add(code);

      couponsToInsert.push({
        code: code,
        type: type,
        benefit_type: benefit_type,
        honey_drops_amount: benefit_type === 'honey_drops' ? honey_drops_amount : null,
        fee_rate: benefit_type === 'fee_reduction' ? fee_rate : null,
        max_uses: max_uses_per_code || 1,
        current_uses: 0,
        expires_at: expiresAt?.toISOString() || null,
        is_active: true,
        created_by: user.id
      });
    }

    // Insert coupon codes into database
    const { data: insertedCoupons, error: insertError } = await supabaseService
      .from("admin_coupon_codes")
      .insert(couponsToInsert)
      .select();

    if (insertError) throw insertError;

    logStep("Coupons generated successfully", { 
      generated_count: insertedCoupons.length,
      codes: insertedCoupons.map(c => c.code)
    });

    return new Response(JSON.stringify({
      success: true,
      generated_count: insertedCoupons.length,
      coupons: insertedCoupons,
      message: `${insertedCoupons.length} kuponkoder genereret succesfuldt`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin-generate-coupons", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});