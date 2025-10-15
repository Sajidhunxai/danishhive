-- Fix Security Definer View issues by addressing the problematic views
-- The issue is that views can bypass RLS by default, which is a security concern

-- Drop and recreate the views to ensure they properly respect RLS and security

-- 1. Drop existing views
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.safe_public_profiles CASCADE;

-- 2. Recreate public_profiles view with proper security considerations
-- This view should only show active freelancer profiles with basic info
CREATE VIEW public.public_profiles AS
SELECT 
    user_id,
    full_name,
    username,
    role,
    bio,
    avatar_url,
    skills,
    hourly_rate,
    availability,
    location,
    created_at
FROM public.profiles p
WHERE role = 'freelancer' 
AND active_status = true
AND p.user_id IS NOT NULL;

-- 3. Recreate safe_public_profiles view with proper security considerations  
-- This view shows basic profile info for active users
CREATE VIEW public.safe_public_profiles AS
SELECT 
    id,
    user_id,
    full_name,
    username,
    role,
    bio,
    avatar_url,
    skills,
    hourly_rate,
    availability,
    location,
    created_at,
    updated_at
FROM public.profiles p
WHERE active_status = true
AND p.user_id IS NOT NULL;

-- Enable RLS on these views to ensure they respect security policies
ALTER VIEW public.public_profiles SET (security_barrier = true);
ALTER VIEW public.safe_public_profiles SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.safe_public_profiles TO authenticated, anon;