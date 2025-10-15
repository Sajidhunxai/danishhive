import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailVerificationRequest {
  newEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { newEmail }: EmailVerificationRequest = await req.json();

    if (!newEmail || !newEmail.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Use service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Store email change request
    const { error: insertError } = await supabaseService
      .from("email_change_requests")
      .insert({
        user_id: user.id,
        new_email: newEmail,
        verification_token: verificationToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (insertError) {
      throw insertError;
    }

    // Send verification email
    const verificationLink = `${req.headers.get("origin")}/verify-email?token=${verificationToken}`;
    
    const emailResponse = await resend.emails.send({
      from: "Danish Hive <noreply@resend.dev>",
      to: [newEmail],
      subject: "Bekræft din registrering - Danish Hive",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="background: linear-gradient(135deg, #007cba, #0056b3); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Danish Hive</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <p style="color: #333; margin-bottom: 20px; font-size: 16px;">
              Hej, tak fordi du vil være en del af vores freelance fællesskab. 
            </p>
            
            <p style="color: #555; margin-bottom: 30px;">
              Du kan godkende din registrering nedenfor, herefter kan du logge ind via 
              <strong>platform.danishhive.com</strong> og opsætte din profil.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #007cba, #0056b3); 
                        color: white; 
                        padding: 14px 28px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        display: inline-block; 
                        font-weight: bold;">
                Godkend registrering
              </a>
            </div>
            
            <p style="color: #555; margin-bottom: 15px; font-size: 14px;">
              Eller kopier dette link i din browser:
            </p>
            <p style="background-color: #f8f9fa; 
                      padding: 12px; 
                      border-radius: 4px; 
                      font-family: monospace; 
                      word-break: break-all; 
                      color: #495057; 
                      font-size: 12px;">
              ${verificationLink}
            </p>
            
            <p style="color: #333; margin: 30px 0 10px 0; font-size: 16px;">
              Velkommen til.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Mvh.<br>
              <strong>Lucca, Founder</strong><br>
              Danish Hive
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email verification sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verifikations email sendt til " + newEmail 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-verification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send verification email" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});