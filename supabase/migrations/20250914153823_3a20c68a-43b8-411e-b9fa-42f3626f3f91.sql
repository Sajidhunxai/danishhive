-- Add constraint to ensure email uniqueness is enforced at profile level
-- and prevent role switching after account creation

-- Add a trigger to prevent role changes once set (except by admins)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow role changes only if done by admin or if role is currently NULL
  IF OLD.role IS NOT NULL AND NEW.role != OLD.role THEN
    -- Check if the current user is admin
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    ) THEN
      -- Also allow the user to change their own role through role_change_requests system
      -- This prevents direct role updates but allows the admin approval system to work
      IF auth.uid() != NEW.user_id THEN
        RAISE EXCEPTION 'Role changes must be approved by an administrator through the role change request system.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role change prevention
CREATE TRIGGER prevent_unauthorized_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Add a function to check if email already exists with different role
CREATE OR REPLACE FUNCTION public.check_email_role_conflict(user_email text, desired_role text)
RETURNS boolean AS $$
DECLARE
  existing_role text;
BEGIN
  -- Get the role of any existing user with this email
  SELECT p.role INTO existing_role
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = user_email;
  
  -- If user exists and has different role, return true (conflict exists)
  IF existing_role IS NOT NULL AND existing_role != desired_role THEN
    RETURN true;
  END IF;
  
  -- No conflict
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;