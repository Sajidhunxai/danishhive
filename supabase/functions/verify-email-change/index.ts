import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyEmailRequest {
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: VerifyEmailRequest = await req.json();

    if (!token) {
      throw new Error("Verification token is required");
    }

    // Use service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the email change request
    const { data: emailRequest, error: fetchError } = await supabaseService
      .from("email_change_requests")
      .select("*")
      .eq("verification_token", token)
      .eq("status", "pending")
      .single();

    if (fetchError || !emailRequest) {
      throw new Error("Invalid or expired verification token");
    }

    // Check if token has expired
    const expiresAt = new Date(emailRequest.expires_at);
    if (expiresAt < new Date()) {
      throw new Error("Verification token has expired");
    }

    // Update user's email in auth.users
    const { error: updateUserError } = await supabaseService.auth.admin.updateUserById(
      emailRequest.user_id,
      { email: emailRequest.new_email }
    );

    if (updateUserError) {
      throw updateUserError;
    }

    // Mark the email change request as verified
    const { error: updateRequestError } = await supabaseService
      .from("email_change_requests")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq("id", emailRequest.id);

    if (updateRequestError) {
      throw updateRequestError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email address successfully updated" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-email-change:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to verify email change" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});