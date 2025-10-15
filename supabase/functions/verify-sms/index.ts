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
    const { phoneNumber, countryCode, verificationCode } = await req.json();

    if (!phoneNumber || !countryCode || !verificationCode) {
      throw new Error('Telefonnummer, landekode og verificeringskode er påkrævet');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Manglende autorisation');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Ugyldig autorisation');
    }

    // Format phone number
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;

    console.log(`Verificerer SMS for ${fullPhoneNumber} med kode ${verificationCode}`);

    // Check verification code
    const { data: verification, error: verifyError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', fullPhoneNumber)
      .eq('verification_code', verificationCode)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (verifyError || !verification) {
      console.error('Verification error:', verifyError);
      throw new Error('Ugyldig eller udløbet verificeringskode');
    }

    // Update user profile with verified phone
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: fullPhoneNumber,
        phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw new Error('Kunne ikke opdatere profil');
    }

    // Delete used verification code
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('phone_number', fullPhoneNumber);

    console.log(`Telefon verificeret succesfuldt for bruger: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telefonnummer verificeret succesfuldt' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-sms function:', error);
    
    let errorMessage = 'Der opstod en fejl ved verificering';
    if (error.message?.includes('Ugyldig eller udløbet')) {
      errorMessage = 'Ugyldig eller udløbet verificeringskode';
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