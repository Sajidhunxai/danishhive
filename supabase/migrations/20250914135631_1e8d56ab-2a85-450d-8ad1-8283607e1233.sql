-- Create function to get all users with emails (admin only)
-- This function safely retrieves user emails for admin purposes
CREATE OR REPLACE FUNCTION admin_get_users_with_email()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  role text,
  is_admin boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_user_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  -- Return profile data with email from auth.users
  RETURN QUERY
  SELECT 
    p.user_id,
    au.email::text,
    p.full_name,
    p.role,
    p.is_admin,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;