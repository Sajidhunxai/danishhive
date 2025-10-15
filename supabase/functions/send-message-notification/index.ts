import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MessageNotificationRequest {
  recipientId: string;
  senderName: string;
  messageContent: string;
  conversationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { recipientId, senderName, messageContent, conversationId }: MessageNotificationRequest = await req.json();

    console.log("Sending message notification:", { recipientId, senderName, conversationId });

    // Get recipient's profile and email from auth.users via RPC
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('user_id', recipientId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error(`Could not fetch recipient profile: ${profileError.message}`);
    }

    // Get recipient email from auth metadata
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(recipientId);
    
    if (userError || !user?.email) {
      console.error("Error fetching user email:", userError);
      throw new Error(`Could not fetch recipient email: ${userError?.message}`);
    }

    const recipientEmail = user.email;
    const recipientName = profile.full_name || "Bruger";

    // Truncate message if too long for email
    const truncatedMessage = messageContent.length > 150 
      ? messageContent.substring(0, 150) + "..."
      : messageContent;

    const emailResponse = await resend.emails.send({
      from: "Danish Hive <noreply@resend.dev>",
      to: [recipientEmail],
      subject: `Ny besked fra ${senderName} - Danish Hive`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Du har fået en ny besked!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Hej ${recipientName},</p>
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
              <strong>${senderName}</strong> har sendt dig en besked på Danish Hive:
            </p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-style: italic; color: #555; font-size: 15px;">"${truncatedMessage}"</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://${Deno.env.get('SUPABASE_PROJECT_ID')}.lovableproject.com/" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Læs og svar på besked
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #888;">
              Dette er en automatisk email fra Danish Hive. Svar ikke på denne email.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #888;">
              <a href="https://${Deno.env.get('SUPABASE_PROJECT_ID')}.lovableproject.com/" style="color: #667eea;">Danish Hive</a> - 
              Hvor freelancere møder drømmekunderne
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-message-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);