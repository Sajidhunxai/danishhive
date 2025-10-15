import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Fetch coupon usage for freelancers (from coupon_usage table)
    const { data: freelancerUsage, error: freelancerError } = await supabaseService
      .from("coupon_usage")
      .select(`
        *,
        profiles!coupon_usage_user_id_fkey (
          full_name
        )
      `)
      .order("used_at", { ascending: false });

    // Fetch coupon usage for clients (from client_coupon_usage table)
    const { data: clientUsage, error: clientError } = await supabaseService
      .from("client_coupon_usage")
      .select(`
        *,
        profiles!client_coupon_usage_user_id_fkey (
          full_name
        )
      `)
      .order("used_at", { ascending: false });

    // Combine and format usage data
    const allUsage = [
      ...(freelancerUsage || []).map(usage => ({
        id: usage.id,
        user_id: usage.user_id,
        coupon_code: usage.coupon_code,
        used_at: usage.used_at,
        user_profile: {
          full_name: usage.profiles?.full_name
        }
      })),
      ...(clientUsage || []).map(usage => ({
        id: usage.id,
        user_id: usage.user_id,
        coupon_code: usage.coupon_code,
        used_at: usage.used_at,
        user_profile: {
          full_name: usage.profiles?.full_name
        }
      }))
    ].sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime());

    return new Response(JSON.stringify({
      success: true,
      usages: allUsage,
      total_count: allUsage.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});