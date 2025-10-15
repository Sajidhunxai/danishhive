-- CRITICAL SECURITY FIX: Add RLS policies to public_profiles table
-- Currently this table exposes all user data publicly without any restrictions

-- Enable RLS on public_profiles table (it's currently disabled)
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to view only active freelancer profiles with complete data
CREATE POLICY "Authenticated users can view complete freelancer profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (
  role = 'freelancer' 
  AND full_name IS NOT NULL 
  AND full_name != '' 
  AND full_name != 'Incomplete Profile'
  AND bio IS NOT NULL 
  AND bio != ''
  AND skills IS NOT NULL 
  AND array_length(skills, 1) > 0
);

-- Policy 2: Allow users to view their own profile data
CREATE POLICY "Users can view their own public profile"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Admins can view all profiles for management purposes
CREATE POLICY "Admins can view all public profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (is_user_admin(auth.uid()));

-- Policy 4: Prevent any modifications to the public_profiles view
-- (This is a view so modifications should go through the profiles table)
CREATE POLICY "No direct modifications to public profiles view"
ON public.public_profiles
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

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

-- Fix safe_public_profiles view to also have RLS
ALTER TABLE public.safe_public_profiles ENABLE ROW LEVEL SECURITY;

-- Apply same policies to safe_public_profiles
CREATE POLICY "Authenticated users can view complete safe freelancer profiles"
ON public.safe_public_profiles
FOR SELECT
TO authenticated
USING (
  role = 'freelancer' 
  AND full_name IS NOT NULL 
  AND full_name != '' 
  AND full_name != 'Incomplete Profile'
  AND bio IS NOT NULL 
  AND bio != ''
  AND skills IS NOT NULL 
  AND array_length(skills, 1) > 0
);

CREATE POLICY "Users can view their own safe public profile"
ON public.safe_public_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all safe public profiles"
ON public.safe_public_profiles
FOR SELECT
TO authenticated
USING (is_user_admin(auth.uid()));

-- Prevent modifications to safe_public_profiles view
CREATE POLICY "No direct modifications to safe public profiles view"
ON public.safe_public_profiles
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);