import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing text for contact info filtering:', text.substring(0, 100) + '...');

    // Enhanced contact information patterns
    const contactPatterns = [
      // Phone numbers - Danish formats
      /(\+45\s*)?(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/g,
      /(\+45)?[\s-]?(\d{8})/g,
      /(\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2})/g,
      
      // Email addresses
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      
      // WhatsApp references
      /whatsapp/gi,
      /wa\.me/gi,
      
      // Social media handles
      /@[a-zA-Z0-9_]+/g,
      
      // Skype
      /skype/gi,
      
      // Telegram
      /telegram/gi,
      /t\.me/gi,
      
      // Discord
      /discord/gi,
      
      // LinkedIn
      /linkedin/gi,
      /linked\.in/gi,
      
      // Common contact phrases in Danish
      /kontakt[\s]*mig/gi,
      /ring[\s]*til[\s]*mig/gi,
      /send[\s]*mig[\s]*en[\s]*sms/gi,
      /skriv[\s]*til[\s]*mig/gi,
      /min[\s]*email/gi,
      /mit[\s]*telefon/gi,
      /min[\s]*mobil/gi,
      
      // Common contact phrases in English
      /contact[\s]*me/gi,
      /call[\s]*me/gi,
      /text[\s]*me/gi,
      /reach[\s]*out/gi,
      /get[\s]*in[\s]*touch/gi,
      /my[\s]*email/gi,
      /my[\s]*phone/gi,
      /my[\s]*number/gi,
    ];

    let hasContactInfo = false;
    const violations: string[] = [];
    let filteredText = text;

    // Check for contact information
    for (const pattern of contactPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        hasContactInfo = true;
        matches.forEach(match => {
          violations.push(match);
          // Replace contact info with placeholder
          filteredText = filteredText.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[KONTAKTOPLYSNING FJERNET]');
        });
      }
    }

    const result = {
      hasContactInfo,
      violations,
      filteredText: hasContactInfo ? filteredText : text,
      originalLength: text.length,
      filteredLength: filteredText.length
    };

    console.log('Contact info filtering result:', {
      hasContactInfo,
      violationCount: violations.length,
      textLengthChange: text.length - filteredText.length
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in filter-contact-info function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})