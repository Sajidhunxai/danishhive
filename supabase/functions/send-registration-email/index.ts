import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface RegistrationEmailRequest {
  email: string;
  fullName: string;
  role: 'client' | 'freelancer';
  confirmationUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, role, confirmationUrl }: RegistrationEmailRequest = await req.json();

    if (!email || !fullName || !role || !confirmationUrl) {
      throw new Error("Manglende påkrævede felter");
    }

    const isFreelancer = role === 'freelancer';
    const roleText = isFreelancer ? 'freelancer' : 'klient';
    
    const emailResponse = await resend.emails.send({
      from: "Danish Hive <noreply@resend.dev>",
      to: [email],
      subject: `Velkommen til Danish Hive - Bekræft din ${roleText} konto`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="background: linear-gradient(135deg, #007cba, #0056b3); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Velkommen til Danish Hive!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Danmarks førende freelancer platform</p>
          </div>
          
          <div style="padding: 40px 20px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hej ${fullName}!</p>
            
            <p style="color: #555; margin-bottom: 20px;">
              Tak fordi du har valgt at blive del af Danish Hive som ${roleText}. 
              ${isFreelancer 
                ? 'Du er nu på vej til at få adgang til spændende freelance projekter fra danske virksomheder.' 
                : 'Du er nu på vej til at få adgang til Danmarks dygtigste freelancere.'
              }
            </p>
            
            <p style="color: #555; margin-bottom: 30px;">
              For at komme i gang skal du bekræfte din email adresse ved at klikke på knappen nedenfor:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${confirmationUrl}" 
                 style="background: linear-gradient(135deg, #007cba, #0056b3); 
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold; 
                        font-size: 16px;
                        box-shadow: 0 4px 12px rgba(0, 124, 186, 0.3);">
                Bekræft din konto
              </a>
            </div>
            
            <p style="color: #555; margin-bottom: 20px;">
              Eller kopier og indsæt dette link i din browser:
            </p>
            <p style="background-color: #f8f9fa; 
                      padding: 15px; 
                      border-radius: 8px; 
                      font-family: monospace; 
                      word-break: break-all; 
                      color: #495057; 
                      border-left: 4px solid #007cba;">
              ${confirmationUrl}
            </p>
            
            <div style="background-color: #e3f2fd; 
                        padding: 20px; 
                        border-radius: 8px; 
                        margin: 30px 0; 
                        border-left: 4px solid #007cba;">
              <h3 style="color: #007cba; margin-top: 0;">Næste skridt efter bekræftelse:</h3>
              ${isFreelancer 
                ? `<ul style="color: #555; margin: 0;">
                     <li>Udfyld din profil med færdigheder og erfaring</li>
                     <li>Upload et professionelt profilbillede</li>
                     <li>Bekræft din telefon og identitet</li>
                     <li>Begynd at søge på spændende projekter</li>
                   </ul>`
                : `<ul style="color: #555; margin: 0;">
                     <li>Udfyld din virksomhedsprofil</li>
                     <li>Bekræft din betalingsmetode</li>
                     <li>Opret dit første projekt</li>
                     <li>Find den perfekte freelancer til dit projekt</li>
                   </ul>`
              }
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 40px;">
              <strong>Har du brug for hjælp?</strong><br>
              Vores supportteam er klar til at hjælpe dig. Kontakt os på 
              <a href="mailto:support@danishhive.com" style="color: #007cba;">support@danishhive.com</a>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
              Dette link udløber om 24 timer af sikkerhedsmæssige årsager.
            </p>
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              Hvis du ikke har oprettet denne konto, kan du trygt ignorere denne email.
            </p>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              Med venlig hilsen,<br>
              <strong>Danish Hive Team</strong><br>
              <em>Connecting Danish talent with opportunities</em>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Registration email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Velkomst email sendt til ${email}` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-registration-email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send registration email" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});