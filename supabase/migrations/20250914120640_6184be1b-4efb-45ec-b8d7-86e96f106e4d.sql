-- Continue fixing Security Definer issues by updating more functions
-- Convert functions that only access user's own data to SECURITY INVOKER

-- 1. Update calculate_user_total_earnings - users should only calculate their own earnings
CREATE OR REPLACE FUNCTION public.calculate_user_total_earnings(user_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  total_amount numeric;
BEGIN
  -- Only allow users to calculate their own earnings or admins to calculate any
  IF user_id_param != auth.uid() AND NOT is_user_admin(auth.uid()) THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(amount), 0) 
  INTO total_amount
  FROM earnings 
  WHERE user_id = user_id_param AND status = 'completed';
  
  -- Update the profile with the calculated total
  UPDATE profiles 
  SET total_earnings = total_amount
  WHERE user_id = user_id_param;
  
  RETURN total_amount;
END;
$$;

-- 2. Update get_own_profile_basic - users accessing their own basic profile data
CREATE OR REPLACE FUNCTION public.get_own_profile_basic(_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, full_name text, username text, role text, bio text, avatar_url text, location text, skills text[], hourly_rate numeric, availability text, is_admin boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id, p.user_id, p.full_name, p.username, p.role, p.bio, p.avatar_url, 
    p.location, p.skills, p.hourly_rate, p.availability, p.is_admin, 
    p.created_at, p.updated_at
  FROM public.profiles p 
  WHERE p.user_id = _user_id AND (_user_id = auth.uid() OR is_user_admin(auth.uid()));
$$;

-- 3. Update get_own_profile_financial - users accessing their own financial data  
CREATE OR REPLACE FUNCTION public.get_own_profile_financial(_user_id uuid)
RETURNS TABLE(iban text, bank_name text, account_holder_name text)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT p.iban, p.bank_name, p.account_holder_name
  FROM public.profiles p 
  WHERE p.user_id = _user_id AND (_user_id = auth.uid() OR is_user_admin(auth.uid()));
$$;

-- 4. Update get_own_profile_personal - users accessing their own personal data
CREATE OR REPLACE FUNCTION public.get_own_profile_personal(_user_id uuid)
RETURNS TABLE(phone text, address text, city text, postal_code text, mitid_verified boolean, mitid_verification_date timestamp with time zone)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT p.phone, p.address, p.city, p.postal_code, p.mitid_verified, p.mitid_verification_date
  FROM public.profiles p 
  WHERE p.user_id = _user_id AND (_user_id = auth.uid() OR is_user_admin(auth.uid()));
$$;