import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, countryCode } = await req.json();

    if (!phoneNumber || !countryCode) {
      throw new Error('Telefonnummer og landekode er påkrævet');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials er ikke konfigureret');
    }

    // Format phone number
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`Sender SMS til ${fullPhoneNumber} med kode ${verificationCode}`);

    // Save verification code to database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: dbError } = await supabase
      .from('phone_verifications')
      .upsert({
        phone_number: fullPhoneNumber,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'phone_number'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Kunne ikke gemme verificeringskode');
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    const message = `Din Danish Hive verificeringskode er: ${verificationCode}. Koden udløber om 10 minutter.`;

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: fullPhoneNumber,
        Body: message,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData);
      throw new Error(`SMS kunne ikke sendes: ${twilioData.message || 'Ukendt fejl'}`);
    }

    console.log('SMS sendt succesfuldt:', twilioData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verificeringskode sendt',
        messageSid: twilioData.sid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-sms function:', error);
    
    let errorMessage = 'Der opstod en fejl ved afsendelse af SMS';
    if (error.message?.includes('phone_number')) {
      errorMessage = 'Dette telefonnummer er allerede registreret';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});