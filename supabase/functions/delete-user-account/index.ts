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
    const { userId } = await req.json()
    
    if (!userId) {
      console.error('No userId provided')
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Starting account deletion for user: ${userId}`)

    // First, check if user exists and get their profile info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, role')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found user profile: ${profile.full_name} (${profile.role})`)

    // Delete related data in order (respecting foreign key constraints)
    
    // 1. Delete forum replies (user's replies to posts)
    const { error: forumRepliesError } = await supabaseAdmin
      .from('forum_replies')
      .delete()
      .eq('author_id', userId)
    
    if (forumRepliesError) {
      console.error('Error deleting forum replies:', forumRepliesError)
    } else {
      console.log('Deleted forum replies')
    }

    // 2. Delete forum posts (user's posts)
    const { error: forumPostsError } = await supabaseAdmin
      .from('forum_posts')
      .delete()
      .eq('author_id', userId)
    
    if (forumPostsError) {
      console.error('Error deleting forum posts:', forumPostsError)
    } else {
      console.log('Deleted forum posts')
    }

    // 3. Delete messages (user's messages in conversations)
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('sender_id', userId)
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
    } else {
      console.log('Deleted messages')
    }

    // 4. Delete conversations where user is participant
    const { error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
    
    if (conversationsError) {
      console.error('Error deleting conversations:', conversationsError)
    } else {
      console.log('Deleted conversations')
    }

    // 5. Delete invitations (sent and received)
    const { error: invitationsError } = await supabaseAdmin
      .from('invitations')
      .delete()
      .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
    
    if (invitationsError) {
      console.error('Error deleting invitations:', invitationsError)
    } else {
      console.log('Deleted invitations')
    }

    // 6. Delete profile reports (both as reporter and reported user)
    const { error: reportsError } = await supabaseAdmin
      .from('profile_reports')
      .delete()
      .or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`)
    
    if (reportsError) {
      console.error('Error deleting profile reports:', reportsError)
    } else {
      console.log('Deleted profile reports')
    }

    // 7. Delete role change requests
    const { error: roleRequestsError } = await supabaseAdmin
      .from('role_change_requests')
      .delete()
      .eq('user_id', userId)
    
    if (roleRequestsError) {
      console.error('Error deleting role change requests:', roleRequestsError)
    } else {
      console.log('Deleted role change requests')
    }

    // 8. Delete language skills
    const { error: languageSkillsError } = await supabaseAdmin
      .from('language_skills')
      .delete()
      .eq('user_id', userId)
    
    if (languageSkillsError) {
      console.error('Error deleting language skills:', languageSkillsError)
    } else {
      console.log('Deleted language skills')
    }

    // 9. Delete projects
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('user_id', userId)
    
    if (projectsError) {
      console.error('Error deleting projects:', projectsError)
    } else {
      console.log('Deleted projects')
    }

    // 10. Delete profile images
    const { error: profileImagesError } = await supabaseAdmin
      .from('profile_images')
      .delete()
      .eq('user_id', userId)
    
    if (profileImagesError) {
      console.error('Error deleting profile images:', profileImagesError)
    } else {
      console.log('Deleted profile images')
    }

    // 11. Delete earnings
    const { error: earningsError } = await supabaseAdmin
      .from('earnings')
      .delete()
      .eq('user_id', userId)
    
    if (earningsError) {
      console.error('Error deleting earnings:', earningsError)
    } else {
      console.log('Deleted earnings')
    }

    // 12. Delete job applications
    const { error: applicationsError } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('applicant_id', userId)
    
    if (applicationsError) {
      console.error('Error deleting job applications:', applicationsError)
    } else {
      console.log('Deleted job applications')
    }

    // 13. Update jobs where user was freelancer (remove freelancer reference)
    const { error: jobsUpdateError } = await supabaseAdmin
      .from('jobs')
      .update({ freelancer_id: null, status: 'open' })
      .eq('freelancer_id', userId)
    
    if (jobsUpdateError) {
      console.error('Error updating jobs:', jobsUpdateError)
    } else {
      console.log('Updated jobs to remove freelancer reference')
    }

    // 14. Update contracts (set user references to null)
    const { error: contractsUpdateError } = await supabaseAdmin
      .from('contracts')
      .update({ 
        freelancer_id: null,
        status: 'cancelled'
      })
      .eq('freelancer_id', userId)
    
    if (contractsUpdateError) {
      console.error('Error updating contracts:', contractsUpdateError)
    } else {
      console.log('Updated contracts to remove freelancer reference')
    }

    // 15. Delete the profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId)
    
    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Deleted user profile')

    // 16. Finally, delete from auth.users (this will cascade delete the session)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from authentication system' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully deleted user account: ${userId}`)

    return new Response(
      JSON.stringify({ 
        message: 'User account deleted successfully',
        deletedUser: {
          id: userId,
          name: profile.full_name,
          role: profile.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})