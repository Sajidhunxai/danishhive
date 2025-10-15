-- First, let's check what profiles exist and fix any incomplete ones
-- Add unique constraint for user_id (this should work)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Update existing profiles to have required defaults for validation
UPDATE public.profiles 
SET 
  full_name = COALESCE(full_name, 'Incomplete Profile'),
  phone = COALESCE(phone, ''),
  address = COALESCE(address, ''),
  city = COALESCE(city, ''),
  postal_code = COALESCE(postal_code, ''),
  phone_verified = COALESCE(phone_verified, false),
  payment_verified = COALESCE(payment_verified, false)
WHERE role = 'client';

-- Now add the NOT NULL constraint for full_name after fixing existing data
ALTER TABLE public.profiles 
ALTER COLUMN full_name SET NOT NULL;