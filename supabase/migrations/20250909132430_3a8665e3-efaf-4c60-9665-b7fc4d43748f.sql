-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION is_client_profile_complete(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role = 'client'
    AND full_name IS NOT NULL 
    AND full_name != ''
    AND full_name != 'Incomplete Profile'
    AND phone IS NOT NULL 
    AND phone != ''
    AND address IS NOT NULL 
    AND address != ''
    AND city IS NOT NULL 
    AND city != ''
    AND postal_code IS NOT NULL 
    AND postal_code != ''
    AND phone_verified = true 
    AND payment_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION validate_client_profile_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate for clients
  IF NEW.role = 'client' THEN
    -- If any required field is missing or verification is false, allow update
    -- but they won't be able to create contracts until complete
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;