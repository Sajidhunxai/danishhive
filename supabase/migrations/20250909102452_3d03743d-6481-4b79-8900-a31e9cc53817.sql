-- Remove the overly restrictive policy that blocks all access
DROP POLICY IF EXISTS "profiles_deny_all_public_access" ON public.profiles;

-- Create a proper restrictive policy that only blocks unauthenticated access
CREATE POLICY "profiles_authenticated_users_only" ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Also ensure we have proper permissive policies for authenticated users
-- Update the existing policies to be more explicit

-- Drop and recreate the select policy to be more explicit
DROP POLICY IF EXISTS "profiles_authenticated_select_own" ON public.profiles;
CREATE POLICY "profiles_authenticated_select_own" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop and recreate the insert policy to be more explicit
DROP POLICY IF EXISTS "profiles_authenticated_insert_own" ON public.profiles;
CREATE POLICY "profiles_authenticated_insert_own" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Drop and recreate the update policy to be more explicit
DROP POLICY IF EXISTS "profiles_authenticated_update_own" ON public.profiles;
CREATE POLICY "profiles_authenticated_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);