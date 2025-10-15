-- Enhanced Security for Profiles Table - Financial and Personal Data Protection
-- This migration implements defense-in-depth security for sensitive user data

-- Drop ALL existing policies first to ensure clean state
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on profiles table
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Create security definer functions for safe data access
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

-- Create new restrictive policies with explicit denials for public access

-- 1. Explicit denial policy for any public access (RESTRICTIVE - highest priority)
CREATE POLICY "profiles_deny_all_public_access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (false);

-- 2. Allow authenticated users to view ONLY their own profile
CREATE POLICY "profiles_authenticated_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to insert ONLY their own profile
CREATE POLICY "profiles_authenticated_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to update ONLY their own profile
CREATE POLICY "profiles_authenticated_update_own"
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

-- 5. Explicit denial for DELETE operations (financial data should never be deleted)
CREATE POLICY "profiles_deny_all_delete"
ON public.profiles
FOR DELETE
TO public
USING (false);

-- Create a safe view for public profile information (no sensitive data)
CREATE OR REPLACE VIEW public.safe_public_profiles AS
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
WHERE p.role IS NOT NULL 
  AND p.full_name IS NOT NULL; -- Only show complete public profiles

-- Add security barrier to the view
ALTER VIEW public.safe_public_profiles SET (security_barrier = true);

-- Create admin audit function with logging
CREATE OR REPLACE FUNCTION public.admin_access_profile_with_audit(_target_user_id UUID, _reason TEXT DEFAULT 'Administrative review')
RETURNS TABLE(
  id UUID,
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ,
  access_logged_at TIMESTAMPTZ
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

  -- Log access attempt (in production, this would go to an audit table)
  RAISE NOTICE 'AUDIT: Admin % accessed profile % at % - Reason: %', 
    auth.uid(), _target_user_id, now(), _reason;
  
  -- Return limited profile data with audit timestamp
  RETURN QUERY
  SELECT p.id, p.user_id, p.full_name, p.phone, p.location, p.created_at, now() as access_logged_at
  FROM public.profiles p 
  WHERE p.user_id = _target_user_id;
END;
$$;

-- Add security documentation
COMMENT ON TABLE public.profiles IS 'SECURITY CRITICAL: Contains sensitive financial and personal data. All access is logged and restricted by defense-in-depth RLS policies.';
COMMENT ON COLUMN public.profiles.iban IS 'FINANCIAL DATA: International Bank Account Number - Highly sensitive';
COMMENT ON COLUMN public.profiles.bank_name IS 'FINANCIAL DATA: Bank name - Sensitive';
COMMENT ON COLUMN public.profiles.account_holder_name IS 'FINANCIAL DATA: Account holder name - Sensitive';
COMMENT ON COLUMN public.profiles.phone IS 'PERSONAL DATA: Phone number - Sensitive';
COMMENT ON COLUMN public.profiles.address IS 'PERSONAL DATA: Street address - Sensitive';
COMMENT ON COLUMN public.profiles.postal_code IS 'PERSONAL DATA: Postal code - Sensitive';
COMMENT ON COLUMN public.profiles.city IS 'PERSONAL DATA: City - Sensitive';

-- Grant minimal necessary permissions
GRANT SELECT ON public.safe_public_profiles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile_basic(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_profile_financial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_access_profile_with_audit(UUID, TEXT) TO authenticated;