-- Update the user creation trigger to handle gender field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with the new user's ID from auth.users
  -- The user_id (NEW.id) is automatically unique since it comes from auth.users primary key
  INSERT INTO public.profiles (user_id, full_name, username, role, gender, birthday)
  VALUES (
    NEW.id,  -- This is the unique UUID from auth.users primary key
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'freelancer'),
    NEW.raw_user_meta_data ->> 'gender',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'birthday' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'birthday')::date
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;