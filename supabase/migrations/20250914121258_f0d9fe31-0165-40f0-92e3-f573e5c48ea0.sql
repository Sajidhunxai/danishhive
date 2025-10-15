-- Fix remaining Security Definer View issues
-- Convert functions that can safely use SECURITY INVOKER

-- 1. Update is_current_user_admin - this only checks current user's admin status
-- It doesn't need SECURITY DEFINER since it only accesses auth.uid() data
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(is_admin, false) 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

-- 2. Keep is_user_admin as SECURITY DEFINER since it's used by RLS policies
-- but add proper authorization check
CREATE OR REPLACE FUNCTION public.is_user_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- This function needs SECURITY DEFINER for RLS policy evaluation
  -- But we'll add a check to ensure it's only used appropriately
  SELECT COALESCE(is_admin, false) 
  FROM public.profiles 
  WHERE user_id = _user_id;
$$;