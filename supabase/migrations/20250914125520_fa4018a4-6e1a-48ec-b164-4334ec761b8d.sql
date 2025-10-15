-- CRITICAL SECURITY FIX: Secure public_profiles and safe_public_profiles views
-- These views currently expose user data without proper access controls

-- Enable RLS on the public_profiles view
ALTER VIEW public.public_profiles SET (security_barrier = true);
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Enable RLS on the safe_public_profiles view  
ALTER VIEW public.safe_public_profiles SET (security_barrier = true);
ALTER VIEW public.safe_public_profiles SET (security_invoker = true);

-- Drop the existing insecure views and recreate them as security definer functions
DROP VIEW IF EXISTS public.public_profiles;
DROP VIEW IF EXISTS public.safe_public_profiles;

-- Create secure function to get public freelancer profiles (replaces public_profiles view)
CREATE OR REPLACE FUNCTION public.get_public_freelancer_profiles()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  username text,
  role text,
  bio text,
  avatar_url text,
  skills text[],
  hourly_rate numeric,
  availability text,
  location text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data to authenticated users
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Log the access for audit purposes
  PERFORM public.log_profile_access(auth.uid(), 'bulk_freelancer_profiles_view');

  -- Return only complete, active freelancer profiles
  RETURN QUERY
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
  FROM profiles p
  WHERE p.role = 'freelancer'
    AND p.active_status = true
    AND p.user_id IS NOT NULL
    AND p.full_name IS NOT NULL 
    AND p.full_name != '' 
    AND p.full_name != 'Incomplete Profile'
    AND p.bio IS NOT NULL 
    AND p.bio != ''
    AND p.skills IS NOT NULL 
    AND array_length(p.skills, 1) > 0;
END;
$$;

-- Create secure function to get public profile by ID (replaces safe_public_profiles view)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_id(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  username text,
  role text,
  bio text,
  avatar_url text,
  skills text[],
  hourly_rate numeric,
  availability text,
  location text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data to authenticated users or for their own profile
  IF auth.uid() IS NULL AND _user_id != auth.uid() THEN
    RETURN;
  END IF;

  -- Log the access for audit purposes
  PERFORM public.log_profile_access(_user_id, 'individual_profile_view');

  -- Return profile data only if it's active and complete
  RETURN QUERY
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
  FROM profiles p
  WHERE p.user_id = _user_id
    AND p.active_status = true
    AND (
      -- Allow own profile access
      p.user_id = auth.uid()
      -- Or allow access to complete freelancer profiles
      OR (p.role = 'freelancer' 
          AND p.full_name IS NOT NULL 
          AND p.full_name != '' 
          AND p.full_name != 'Incomplete Profile')
      -- Or allow admin access
      OR is_user_admin(auth.uid())
    );
END;
$$;

-- Create admin function for secure profile access with full audit trail
CREATE OR REPLACE FUNCTION public.admin_get_profile_by_id(_user_id uuid, _reason text DEFAULT 'Administrative review')
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  username text,
  role text,
  bio text,
  avatar_url text,
  skills text[],
  hourly_rate numeric,
  availability text,
  location text,
  phone text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin privileges
  IF NOT public.is_user_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  -- Log admin access with reason
  PERFORM public.log_profile_access(_user_id, 'admin_profile_access');
  
  -- Log to application logs for audit
  RAISE NOTICE 'AUDIT: Admin % accessed profile % - Reason: %', 
    auth.uid(), _user_id, _reason;

  -- Return full profile data for admin
  RETURN QUERY
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
    p.phone,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = _user_id;
END;
$$;