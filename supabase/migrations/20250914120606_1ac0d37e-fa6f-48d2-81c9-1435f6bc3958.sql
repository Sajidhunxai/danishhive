-- Fix Security Definer View issues by updating functions that don't need SECURITY DEFINER
-- These functions can safely use SECURITY INVOKER with proper RLS policies

-- 1. Update is_freelancer_profile_complete to use SECURITY INVOKER
-- This function is only used to check the current user's profile completion
CREATE OR REPLACE FUNCTION public.is_freelancer_profile_complete(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow users to check their own profile completion or admins
  IF user_id_param != auth.uid() AND NOT is_user_admin(auth.uid()) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_id_param 
    AND p.role = 'freelancer'
    AND p.full_name IS NOT NULL 
    AND p.full_name != ''
    AND p.full_name != 'Incomplete Profile'
    AND p.bio IS NOT NULL 
    AND p.bio != ''
    AND p.skills IS NOT NULL 
    AND array_length(p.skills, 1) > 0
    AND p.location IS NOT NULL 
    AND p.location != ''
    AND p.hourly_rate IS NOT NULL 
    AND p.hourly_rate > 0
    AND p.phone IS NOT NULL 
    AND p.phone != ''
    AND p.phone_verified = true
    AND EXISTS (
      SELECT 1 FROM public.profile_images pi
      WHERE pi.user_id = p.user_id 
      AND pi.status = 'approved'
    )
  );
END;
$$;

-- 2. Update is_client_profile_complete to use SECURITY INVOKER  
-- This function is used to check client profile completion
CREATE OR REPLACE FUNCTION public.is_client_profile_complete(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow users to check their own profile completion or admins
  IF user_id_param != auth.uid() AND NOT is_user_admin(auth.uid()) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role = 'client'
    AND full_name IS NOT NULL 
    AND full_name != ''
    AND full_name != 'Incomplete Profile'
    AND phone IS NOT NULL 
    AND phone != ''
    AND address IS NOT NULL 
    AND address != ''
    AND city IS NOT NULL 
    AND city != ''
    AND postal_code IS NOT NULL 
    AND postal_code != ''
    AND phone_verified = true 
    AND payment_verified = true
  );
END;
$$;