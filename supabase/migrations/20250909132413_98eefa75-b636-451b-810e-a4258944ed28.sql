-- Create function to validate complete client profile
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update contracts policy to use the validation function
DROP POLICY IF EXISTS "Payment verified clients can create contracts for their jobs" ON public.contracts;

CREATE POLICY "Complete profile clients can create contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (
  auth.uid() = client_id AND 
  is_client_profile_complete(auth.uid())
);

-- Add validation trigger to prevent incomplete profile updates for clients
CREATE OR REPLACE FUNCTION validate_client_profile_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate for clients
  IF NEW.role = 'client' THEN
    -- If any required field is missing or verification is false, prevent update
    IF NEW.full_name IS NULL OR NEW.full_name = '' OR NEW.full_name = 'Incomplete Profile' OR
       NEW.phone IS NULL OR NEW.phone = '' OR
       NEW.address IS NULL OR NEW.address = '' OR
       NEW.city IS NULL OR NEW.city = '' OR
       NEW.postal_code IS NULL OR NEW.postal_code = '' OR
       NEW.phone_verified != true OR
       NEW.payment_verified != true THEN
      
      -- Allow the update but mark as incomplete if it's the initial profile completion
      -- This prevents users from creating contracts until everything is complete
      NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;