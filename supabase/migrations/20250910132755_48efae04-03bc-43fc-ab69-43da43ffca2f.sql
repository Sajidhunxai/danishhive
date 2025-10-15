-- Fix security definer views by recreating them without SECURITY DEFINER
-- Drop and recreate public_profiles view
DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE VIEW public.public_profiles AS
SELECT 
  p.user_id,
  p.full_name,
  p.username,
  p.role,
  p.bio,
  p.avatar_url,
  p.skills,
  p.hourly_rate,
  p.availability,
  p.location,
  p.created_at
FROM public.profiles p
WHERE p.role = 'freelancer' AND p.active_status = true;

-- Drop and recreate safe_public_profiles view
DROP VIEW IF EXISTS public.safe_public_profiles CASCADE;
CREATE VIEW public.safe_public_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.username,
  p.role,
  p.bio,
  p.avatar_url,
  p.skills,
  p.hourly_rate,
  p.availability,
  p.location,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.active_status = true;