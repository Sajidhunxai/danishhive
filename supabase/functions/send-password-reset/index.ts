import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequestBody {
  email: string;
  redirectTo?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: ResetRequestBody = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const resend = new Resend(RESEND_API_KEY);

    const fallbackRedirect = "https://fmgbsampskpmcaabyznk.lovableproject.com/auth";

    // Generate a password recovery link using Admin API
    const { data, error: genError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: redirectTo || fallbackRedirect },
    });

    if (genError) {
      console.error("generateLink error:", genError);
      // Do not leak whether a user exists. If user not found, return 200
      const code = (genError as any)?.code;
      const status = (genError as any)?.status;
      if (code === "user_not_found" || status === 404) {
        console.warn("Password reset requested for non-existing user:", email);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      return new Response(
        JSON.stringify({ error: genError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const actionLink = (data as any)?.properties?.action_link as string | undefined;

    if (!actionLink) {
      console.error("No action_link returned from generateLink", data);
      return new Response(
        JSON.stringify({ error: "Could not generate reset link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send the email via Resend
    const emailResponse = await resend.emails.send({
      from: "Danish Hive <onboarding@resend.dev>",
      to: [email],
      subject: "Nulstil din adgangskode",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2>Hej</h2>
          <p>Du har anmodet om at nulstille din adgangskode til Danish Hive.</p>
          <p>Klik på knappen herunder for at vælge en ny adgangskode:</p>
          <p>
            <a href="${actionLink}" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
              Nulstil adgangskode
            </a>
          </p>
          <p>Hvis knappen ikke virker, kan du kopiere og indsætte dette link i din browser:</p>
          <p><a href="${actionLink}">${actionLink}</a></p>
          <p style="color:#64748b;">Hvis du ikke har bedt om nulstilling, kan du ignorere denne email.</p>
        </div>
      `,
    });

    console.log("Password reset email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("send-password-reset error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
