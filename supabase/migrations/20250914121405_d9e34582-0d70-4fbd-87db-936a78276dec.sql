-- Fix Security Definer View issues by using security_invoker option
-- This ensures views respect RLS policies properly

-- Drop and recreate views with security_invoker = true
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.safe_public_profiles CASCADE;

-- Recreate public_profiles view with security_invoker = true
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
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

-- Recreate safe_public_profiles view with security_invoker = true  
CREATE VIEW public.safe_public_profiles
WITH (security_invoker = true) AS
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

-- Grant appropriate permissions
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.safe_public_profiles TO authenticated, anon;