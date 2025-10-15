-- Add unique constraints to prevent duplicate registrations
-- Phone numbers should be unique across all profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_phone_number UNIQUE (phone);

-- User_id is already unique as it's the primary key reference, but let's make it explicit
-- This ensures one profile per user from auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Create a function to check for existing phone number during signup
CREATE OR REPLACE FUNCTION public.check_phone_availability(phone_number TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE phone = phone_number AND phone IS NOT NULL AND phone != ''
  );
$$;