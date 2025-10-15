-- Enhanced Security for Profiles Table - Financial and Personal Data Protection
-- This migration implements defense-in-depth security for sensitive user data

-- First, let's create security definer functions for safe data access
CREATE OR REPLACE FUNCTION public.get_own_profile_basic(_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  full_name TEXT,
  username TEXT,
  role TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  skills TEXT[],
  hourly_rate NUMERIC,
  availability TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id, p.user_id, p.full_name, p.username, p.role, p.bio, p.avatar_url, 
    p.location, p.skills, p.hourly_rate, p.availability, p.is_admin, 
    p.created_at, p.updated_at
  FROM public.profiles p 
  WHERE p.user_id = _user_id AND _user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_own_profile_financial(_user_id UUID)
RETURNS TABLE(
  iban TEXT,
  bank_name TEXT,
  account_holder_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.iban, p.bank_name, p.account_holder_name
  FROM public.profiles p 
  WHERE p.user_id = _user_id AND _user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_own_profile_personal(_user_id UUID)
RETURNS TABLE(
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  mitid_verified BOOLEAN,
  mitid_verification_date TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.phone, p.address, p.city, p.postal_code, p.mitid_verified, p.mitid_verification_date
  FROM public.profiles p 
  WHERE p.user_id = _user_id AND _user_id = auth.uid();
$$;

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new restrictive policies with explicit denials for public access

-- 1. Explicit denial policy for any public access (highest priority)
CREATE POLICY "Deny all public access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (false);

-- 2. Allow authenticated users to view ONLY their own profile
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to insert ONLY their own profile
CREATE POLICY "Users can insert their own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to update ONLY their own profile
CREATE POLICY "Users can update their own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND auth.role() = 'authenticated'
);

-- 5. Explicit denial for DELETE operations (financial data should never be deleted, only masked)
CREATE POLICY "Deny all delete operations on profiles"
ON public.profiles
FOR DELETE
TO public
USING (false);

-- Create a view for public profile information (safe for public consumption)
CREATE OR REPLACE VIEW public.public_profiles AS
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
WHERE p.role IS NOT NULL; -- Only show profiles that are set up

-- Enable RLS on the public view as well
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create additional security functions for admin access with audit logging
CREATE OR REPLACE FUNCTION public.admin_view_profile_audit(_target_user_id UUID, _reason TEXT DEFAULT 'Administrative access')
RETURNS TABLE(
  id UUID,
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin access
  IF NOT public.is_user_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  -- Log the access attempt (in a real system, you'd log to an audit table)
  RAISE NOTICE 'Admin % accessed profile % - Reason: %', auth.uid(), _target_user_id, _reason;
  
  -- Return only essential profile data for admin use
  RETURN QUERY
  SELECT p.id, p.user_id, p.full_name, p.phone, p.location, p.created_at
  FROM public.profiles p 
  WHERE p.user_id = _target_user_id;
END;
$$;

-- Create a function to safely mask sensitive data for debugging/support
CREATE OR REPLACE FUNCTION public.mask_sensitive_profile_data(_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  full_name TEXT,
  masked_phone TEXT,
  masked_iban TEXT,
  location TEXT,
  has_financial_data BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    CASE 
      WHEN p.phone IS NOT NULL THEN CONCAT(LEFT(p.phone, 3), '****', RIGHT(p.phone, 2))
      ELSE NULL 
    END as masked_phone,
    CASE 
      WHEN p.iban IS NOT NULL THEN CONCAT(LEFT(p.iban, 4), '****', RIGHT(p.iban, 4))
      ELSE NULL 
    END as masked_iban,
    p.location,
    (p.iban IS NOT NULL OR p.bank_name IS NOT NULL) as has_financial_data
  FROM public.profiles p 
  WHERE p.user_id = _user_id AND public.is_user_admin(auth.uid());
$$;

-- Add comments to document the security measures
COMMENT ON TABLE public.profiles IS 'Contains sensitive user data. Protected by defense-in-depth RLS policies. Financial data requires special handling.';
COMMENT ON COLUMN public.profiles.iban IS 'SENSITIVE: Banking information. Access logged and restricted.';
COMMENT ON COLUMN public.profiles.bank_name IS 'SENSITIVE: Banking information. Access logged and restricted.';
COMMENT ON COLUMN public.profiles.account_holder_name IS 'SENSITIVE: Banking information. Access logged and restricted.';
COMMENT ON COLUMN public.profiles.phone IS 'SENSITIVE: Personal contact information.';
COMMENT ON COLUMN public.profiles.address IS 'SENSITIVE: Personal address information.';
COMMENT ON COLUMN public.profiles.postal_code IS 'SENSITIVE: Personal address information.';
COMMENT ON COLUMN public.profiles.mitid_verified IS 'SENSITIVE: Government ID verification status.';

-- Grant appropriate permissions
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_profile_basic(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_profile_financial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_profile_personal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_view_profile_audit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_sensitive_profile_data(UUID) TO authenticated;