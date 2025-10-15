import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const adminEmail = 'lkk@danishhive.com'
    const adminPassword = 'Sommer2010-'
    
    console.log('Starting admin creation process for:', adminEmail)

    // Try to create the auth user first
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    if (authError) {
      console.log('Auth creation failed:', authError.message)
      
      // If user already exists, try to find them
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('User already exists, trying to find existing user')
        
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          throw new Error('Failed to list users: ' + listError.message)
        }
        
        const existingUser = existingUsers.users.find(user => user.email === adminEmail)
        
        if (!existingUser) {
          throw new Error('User should exist but was not found')
        }
        
        console.log('Found existing user:', existingUser.id)
        
        // Try to create profile for existing user
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: existingUser.id,
            full_name: 'Danish Hive Admin',
            role: 'admin',
            is_admin: true
          })

        if (profileError) {
          console.error('Profile creation failed:', profileError.message)
          
          // Check if profile already exists
          const { data: existingProfile, error: checkError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('user_id', existingUser.id)
            .maybeSingle()
            
          if (checkError) {
            throw new Error('Failed to check existing profile: ' + checkError.message)
          }
          
          if (existingProfile) {
            console.log('Profile already exists, updating to admin role')
            
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({
                role: 'admin',
                is_admin: true,
                full_name: 'Danish Hive Admin'
              })
              .eq('user_id', existingUser.id)
              
            if (updateError) {
              throw new Error('Failed to update profile to admin: ' + updateError.message)
            }
          } else {
            throw new Error('Profile creation failed: ' + profileError.message)
          }
        }

        return new Response(
          JSON.stringify({ 
            message: 'Admin user configured successfully',
            admin: {
              id: existingUser.id,
              email: existingUser.email
            }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        throw new Error('Auth user creation failed: ' + authError.message)
      }
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Create admin profile for new user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: 'Danish Hive Admin',
        role: 'admin',
        is_admin: true
      })

    if (profileError) {
      console.error('Profile creation failed, cleaning up auth user:', profileError.message)
      
      // Delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      throw new Error('Failed to create admin profile: ' + profileError.message)
    }

    console.log('Admin user and profile created successfully')

    return new Response(
      JSON.stringify({ 
        message: 'Initial admin user created successfully',
        admin: {
          id: authData.user.id,
          email: authData.user.email
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})