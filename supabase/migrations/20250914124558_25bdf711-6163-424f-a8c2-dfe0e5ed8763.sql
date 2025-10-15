-- CRITICAL SECURITY FIX: Secure profile access through proper RLS policies
-- Cannot add RLS to views, so we need to secure the underlying data access

-- Create audit table for profile access logging
CREATE TABLE IF NOT EXISTS public.profile_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_user_id uuid NOT NULL,
  accessor_user_id uuid,
  access_type text NOT NULL DEFAULT 'view',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.profile_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profile access audit"
ON public.profile_access_audit
FOR SELECT
TO authenticated
USING (is_user_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert profile access logs"
ON public.profile_access_audit
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to log profile access
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
END;
$$;

-- Create secure function to get public profile data with access logging
CREATE OR REPLACE FUNCTION public.get_public_profile_secure(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  username text,
  role text,
  bio text,
  avatar_url text,
  location text,
  skills text[],
  hourly_rate numeric,
  availability text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access to complete freelancer profiles or own profile or admin access
  IF NOT (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = _user_id 
      AND (
        -- Complete freelancer profile
        (p.role = 'freelancer' 
         AND p.full_name IS NOT NULL 
         AND p.full_name != '' 
         AND p.full_name != 'Incomplete Profile'
         AND p.bio IS NOT NULL 
         AND p.bio != ''
         AND p.skills IS NOT NULL 
         AND array_length(p.skills, 1) > 0
         AND p.active_status = true)
        -- Or own profile
        OR p.user_id = auth.uid()
        -- Or admin access
        OR is_user_admin(auth.uid())
      )
    )
  ) THEN
    RETURN;
  END IF;

  -- Log the access
  PERFORM public.log_profile_access(_user_id, 'public_profile_view');

  -- Return the profile data
  RETURN QUERY
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
    p.created_at
  FROM profiles p
  WHERE p.user_id = _user_id;
END;
$$;

-- Create function to get all visible public profiles with proper access control
CREATE OR REPLACE FUNCTION public.get_all_public_profiles_secure()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  username text,
  role text,
  bio text,
  avatar_url text,
  location text,
  skills text[],
  hourly_rate numeric,
  availability text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only authenticated users can access public profiles
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Log bulk access
  PERFORM public.log_profile_access(auth.uid(), 'bulk_public_profiles_view');

  -- Return only complete freelancer profiles
  RETURN QUERY
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
    p.created_at
  FROM profiles p
  WHERE p.role = 'freelancer'
    AND p.full_name IS NOT NULL 
    AND p.full_name != '' 
    AND p.full_name != 'Incomplete Profile'
    AND p.bio IS NOT NULL 
    AND p.bio != ''
    AND p.skills IS NOT NULL 
    AND array_length(p.skills, 1) > 0
    AND p.active_status = true;
END;
$$;

-- Add additional security validation to existing location validation
-- Enhance the existing trigger to be more robust
CREATE OR REPLACE FUNCTION public.validate_freelancer_location()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  european_countries TEXT[] := ARRAY[
    'Danmark', 'Norge', 'Sverige', 'Finland', 'Tyskland', 'Frankrig',
    'Storbritannien', 'Italien', 'Spanien', 'Holland', 'Belgien',
    'Østrig', 'Schweiz', 'Polen', 'Tjekkiet', 'Portugal', 'Irland'
  ];
BEGIN
  -- Only validate for freelancers
  IF NEW.role = 'freelancer' THEN
    -- Check if location is provided and is European
    IF NEW.location IS NULL OR NOT (NEW.location = ANY(european_countries)) THEN
      -- Log the failed attempt for security monitoring
      INSERT INTO public.profile_access_audit (
        accessed_user_id,
        accessor_user_id,
        access_type,
        created_at
      ) VALUES (
        COALESCE(NEW.user_id, auth.uid()),
        auth.uid(),
        'location_validation_failed',
        now()
      );
      
      RAISE EXCEPTION 'Kun freelancere fra Europa kan registrere sig på platformen. Tilladte lande: %', 
        array_to_string(european_countries, ', ');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;