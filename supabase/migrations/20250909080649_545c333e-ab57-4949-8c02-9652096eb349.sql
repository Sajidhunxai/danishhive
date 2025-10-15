-- Create admin user function to be called by application
CREATE OR REPLACE FUNCTION create_admin_user(admin_email text, admin_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  result json;
BEGIN
  -- Insert into auth.users (this is for demonstration - in production this would be done via Supabase Auth API)
  -- For now, we'll create a placeholder function that returns the expected result
  
  -- Generate a UUID for the user
  user_id := gen_random_uuid();
  
  -- Create the profile entry for the admin user
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    role, 
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'Danish Hive Admin',
    'admin',
    true,
    now(),
    now()
  );
  
  result := json_build_object(
    'user_id', user_id,
    'email', admin_email,
    'message', 'Admin profile created successfully'
  );
  
  RETURN result;
END;
$$;

-- Function to change user role (admin only)
CREATE OR REPLACE FUNCTION admin_change_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_user_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'client', 'freelancer') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Update user role
  UPDATE public.profiles 
  SET role = new_role,
      is_admin = (new_role = 'admin'),
      updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  role text,
  is_admin boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id, 
    p.full_name, 
    p.role, 
    p.is_admin,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE is_user_admin(auth.uid());
$$;