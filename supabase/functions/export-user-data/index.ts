import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Exporting data for user: ${user.id}`);

    // Fetch all user data from various tables
    const [
      profileData,
      jobsAsClientData,
      jobsAsFreelancerData,
      applicationsData,
      conversationsData,
      messagesData,
      earningsData,
      contractsAsClientData,
      contractsAsFreelancerData,
      projectsData,
      languageSkillsData,
      referralsData,
      profileImagesData
    ] = await Promise.all([
      // Profile data
      supabase.from('profiles').select('*').eq('user_id', user.id),
      
      // Jobs where user is client
      supabase.from('jobs').select('*').eq('client_id', user.id),
      
      // Jobs where user is freelancer
      supabase.from('jobs').select('*').eq('freelancer_id', user.id),
      
      // Job applications
      supabase.from('job_applications').select('*').eq('applicant_id', user.id),
      
      // Conversations
      supabase.from('conversations')
        .select('*')
        .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`),
      
      // Messages
      supabase.from('messages').select('*').eq('sender_id', user.id),
      
      // Earnings
      supabase.from('earnings').select('*').eq('user_id', user.id),
      
      // Contracts as client
      supabase.from('contracts').select('*').eq('client_id', user.id),
      
      // Contracts as freelancer
      supabase.from('contracts').select('*').eq('freelancer_id', user.id),
      
      // Projects/Portfolio
      supabase.from('projects').select('*').eq('user_id', user.id),
      
      // Language skills
      supabase.from('language_skills').select('*').eq('user_id', user.id),
      
      // Referrals
      supabase.from('referrals')
        .select('*')
        .or(`referrer_id.eq.${user.id},referred_user_id.eq.${user.id}`),
      
      // Profile images
      supabase.from('profile_images').select('*').eq('user_id', user.id)
    ]);

    // Compile all data
    const userData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        export_version: '1.0'
      },
      account: {
        user_id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at
      },
      profile: profileData.data?.[0] || null,
      jobs: {
        as_client: jobsAsClientData.data || [],
        as_freelancer: jobsAsFreelancerData.data || []
      },
      applications: applicationsData.data || [],
      conversations: conversationsData.data || [],
      messages: messagesData.data || [],
      earnings: earningsData.data || [],
      contracts: {
        as_client: contractsAsClientData.data || [],
        as_freelancer: contractsAsFreelancerData.data || []
      },
      projects: projectsData.data || [],
      language_skills: languageSkillsData.data || [],
      referrals: referralsData.data || [],
      profile_images: profileImagesData.data || []
    };

    // Remove sensitive information
    if (userData.profile) {
      // Keep most profile data but remove internal system fields
      delete userData.profile.mollie_customer_id;
      delete userData.profile.phone_verification_code;
    }

    // Remove sensitive message content if needed
    userData.messages.forEach((message: any) => {
      if (message.is_filtered) {
        message.content = '[FILTERED CONTENT]';
      }
    });

    console.log(`Successfully exported data for user: ${user.id}`);

    return new Response(
      JSON.stringify(userData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="danish-hive-data-export-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );

  } catch (error) {
    console.error('Error in export-user-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
