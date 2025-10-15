-- Create referrals table to track friend referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bonus_paid BOOLEAN DEFAULT FALSE,
  bonus_amount NUMERIC DEFAULT 500,
  referred_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bonus_paid_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referred_email)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals
CREATE POLICY "Users can create their own referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can update referrals"
ON public.referrals
FOR UPDATE
USING (true);

-- Create referral bonuses table for tracking bonus payments
CREATE TABLE public.referral_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 500,
  currency TEXT NOT NULL DEFAULT 'DKK',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.referral_bonuses ENABLE ROW LEVEL SECURITY;

-- Create policies for referral bonuses
CREATE POLICY "Users can view their own referral bonuses"
ON public.referral_bonuses
FOR SELECT
USING (auth.uid() = referrer_id);

-- Function to check and process referral bonuses when earnings are updated
CREATE OR REPLACE FUNCTION public.check_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_total_earnings NUMERIC;
  referral_record RECORD;
BEGIN
  -- Get current user's total earnings
  SELECT COALESCE(SUM(amount), 0) INTO user_total_earnings
  FROM earnings 
  WHERE user_id = NEW.user_id AND status = 'completed';
  
  -- Check if user was referred and has earned at least 2000kr
  IF user_total_earnings >= 2000 THEN
    -- Find referral record where this user was referred
    FOR referral_record IN 
      SELECT r.* FROM referrals r 
      WHERE r.referred_user_id = NEW.user_id 
      AND r.bonus_paid = FALSE
    LOOP
      -- Update referral status
      UPDATE referrals 
      SET 
        status = 'completed',
        bonus_paid = TRUE,
        bonus_paid_at = NOW(),
        referred_earnings = user_total_earnings,
        updated_at = NOW()
      WHERE id = referral_record.id;
      
      -- Create referral bonus record
      INSERT INTO referral_bonuses (
        referrer_id,
        referral_id,
        amount,
        status,
        created_at,
        updated_at
      ) VALUES (
        referral_record.referrer_id,
        referral_record.id,
        500,
        'pending',
        NOW(),
        NOW()
      );
      
      -- Add bonus to referrer's earnings
      INSERT INTO earnings (
        user_id,
        amount,
        currency,
        status,
        description,
        created_at,
        updated_at
      ) VALUES (
        referral_record.referrer_id,
        500,
        'DKK',
        'completed',
        'Henvisningsbonus for ' || referral_record.referred_email,
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to check referral bonuses when earnings are updated
CREATE TRIGGER check_referral_bonus_trigger
  AFTER INSERT OR UPDATE ON public.earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_bonus();

-- Function to link referred user when they sign up
CREATE OR REPLACE FUNCTION public.link_referred_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update referral record with the new user's ID
  UPDATE referrals 
  SET 
    referred_user_id = NEW.id,
    status = 'registered',
    updated_at = NOW()
  WHERE referred_email = NEW.email AND referred_user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger to link referred users when they register
CREATE TRIGGER link_referred_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_referred_user();

-- Add updated_at trigger for referrals table
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for referral_bonuses table  
CREATE TRIGGER update_referral_bonuses_updated_at
  BEFORE UPDATE ON public.referral_bonuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();