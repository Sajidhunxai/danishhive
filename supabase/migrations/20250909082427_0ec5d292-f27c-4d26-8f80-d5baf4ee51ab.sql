-- Ensure the handle_new_user trigger function is properly set up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table with the new user's ID from auth.users
  -- The user_id (NEW.id) is automatically unique since it comes from auth.users primary key
  INSERT INTO public.profiles (user_id, full_name, username, role)
  VALUES (
    NEW.id,  -- This is the unique UUID from auth.users primary key
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'freelancer')
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure user_id in profiles is not nullable (this ensures data integrity)
ALTER TABLE public.profiles 
  ALTER COLUMN user_id SET NOT NULL;