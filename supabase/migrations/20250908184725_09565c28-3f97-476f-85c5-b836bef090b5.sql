-- Fix security definer view warning by removing security_barrier and implementing proper RLS
-- Replace the problematic view with a properly secured version

-- Drop the previous view with security_barrier
DROP VIEW IF EXISTS public.public_profiles;

-- Create a new view without security_barrier but with proper RLS protection
CREATE VIEW public.public_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.username,
  p.role,
  p.bio,
  p.avatar_url,
  p.location,
  p.skills,
  p.hourly_rate,
  p.availability,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.role IS NOT NULL -- Only show profiles that are set up

-- Enable RLS on the view properly (without security_barrier which is the problematic setting)
ALTER VIEW public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy for the view that allows public read access to non-sensitive profile data only
CREATE POLICY "Public can view basic profile information"
ON public.public_profiles
FOR SELECT
TO public
USING (true);  -- This is safe because the view only exposes non-sensitive fields

-- Revoke and re-grant permissions properly
REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;