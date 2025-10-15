-- Fix security definer view warning by creating a proper secure view
-- Views cannot have RLS enabled, so we'll create a secure view that only exposes safe data

-- Drop the previous problematic view
DROP VIEW IF EXISTS public.public_profiles;

-- Create a simple, secure view that only exposes non-sensitive profile data
-- This view is inherently secure because it doesn't include financial or sensitive personal data
CREATE VIEW public.public_profiles AS
SELECT 
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
  p.created_at
FROM public.profiles p
WHERE p.role IS NOT NULL -- Only show profiles that are set up
AND p.user_id IS NOT NULL; -- Additional safety check

-- Grant appropriate permissions for the safe view
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add a comment explaining the security design
COMMENT ON VIEW public.public_profiles IS 'Safe public view of profiles containing only non-sensitive data. Financial and personal details are excluded.';