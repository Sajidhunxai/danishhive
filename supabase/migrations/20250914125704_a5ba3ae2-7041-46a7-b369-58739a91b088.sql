-- SECURITY FIX: Replace insecure views with secure functions
-- Check if views exist first and handle them appropriately

-- Only drop views if they exist
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.safe_public_profiles CASCADE;

-- Ensure the log_profile_access function exists with correct signature
CREATE OR REPLACE FUNCTION public.log_profile_access(
  _accessed_user_id uuid,
  _access_type text DEFAULT 'view'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert access log (ignore errors to not break functionality)
  BEGIN
    INSERT INTO public.profile_access_audit (
      accessed_user_id,
      accessor_user_id,
      access_type,
      created_at
    ) VALUES (
      _accessed_user_id,
      auth.uid(),
      _access_type,
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    NULL;
  END;
END;
$$;

-- Create secure function to replace public_profiles view
CREATE OR REPLACE FUNCTION public.get_secure_freelancer_profiles()
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
  -- Only authenticated users can access
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Log access for audit
  PERFORM public.log_profile_access(auth.uid(), 'bulk_freelancer_view');

  -- Return only complete freelancer profiles
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
    AND p.bio != '';
END;
$$;