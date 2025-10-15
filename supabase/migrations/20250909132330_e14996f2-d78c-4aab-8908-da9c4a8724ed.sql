-- Add unique constraints and validation to prevent duplicate registrations and ensure data integrity

-- Make email unique in profiles (even though auth.users already has this)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add NOT NULL constraints for required fields
ALTER TABLE public.profiles 
ALTER COLUMN full_name SET NOT NULL;

-- Add check constraints for required client fields
ALTER TABLE public.profiles 
ADD CONSTRAINT check_client_required_fields 
CHECK (
  role != 'client' OR (
    full_name IS NOT NULL AND 
    phone IS NOT NULL AND 
    address IS NOT NULL AND 
    city IS NOT NULL AND 
    postal_code IS NOT NULL AND
    phone_verified = true AND
    payment_verified = true
  )
);

-- Ensure only verified clients can create contracts
CREATE OR REPLACE FUNCTION check_client_profile_complete(client_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = client_user_id 
    AND role = 'client'
    AND full_name IS NOT NULL 
    AND phone IS NOT NULL 
    AND address IS NOT NULL 
    AND city IS NOT NULL 
    AND postal_code IS NOT NULL
    AND phone_verified = true 
    AND payment_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;