-- Final attempt to fix remaining Security Definer View issues
-- Convert remaining functions that don't absolutely need SECURITY DEFINER

-- 1. Update check_phone_availability to use proper security model
-- This function can be SECURITY INVOKER since it only checks public phone availability
CREATE OR REPLACE FUNCTION public.check_phone_availability(phone_number text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
  -- Only check phone availability against public data
  -- This doesn't need elevated privileges as it's a simple existence check
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE phone = phone_number AND phone IS NOT NULL AND phone != ''
  );
$$;

-- 2. For contract number generation, we need to keep SECURITY DEFINER for uniqueness
-- But let's add proper security checks to ensure only authorized users can generate numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contract_num TEXT;
  year_suffix TEXT;
  counter INTEGER;
BEGIN
  -- Only allow authenticated users to generate contract numbers
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to generate contract numbers';
  END IF;
  
  -- Additional check: only clients should be generating contracts in normal flow
  -- But admins should also be able to generate them
  IF NOT (
    EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('client', 'admin')) 
    OR is_user_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only clients and admins can generate contract numbers';
  END IF;

  -- Get current year suffix
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next counter for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN contract_number ~ ('^CNT-' || year_suffix || '-[0-9]+$')
      THEN CAST(SPLIT_PART(contract_number, '-', 3) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO counter
  FROM public.contracts;
  
  -- Format: CNT-YY-NNNN
  contract_num := 'CNT-' || year_suffix || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN contract_num;
END;
$$;