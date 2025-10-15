-- Add referral limit to profiles and email change verification
ALTER TABLE public.profiles 
ADD COLUMN referral_limit INTEGER DEFAULT 20,
ADD COLUMN referrals_used INTEGER DEFAULT 0;

-- Create email change verification table
CREATE TABLE public.email_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_email TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for email change requests
CREATE POLICY "Users can view their own email change requests"
ON public.email_change_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email change requests"
ON public.email_change_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update email change requests"
ON public.email_change_requests
FOR UPDATE
USING (true);

-- Function to update referral counts and limits
CREATE OR REPLACE FUNCTION public.update_referral_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If referral status changes to completed, increase referrer's limit
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles 
    SET referral_limit = referral_limit + 5
    WHERE user_id = NEW.referrer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral count updates
CREATE TRIGGER update_referral_counts_trigger
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_counts();

-- Update existing referral bonus function to include count updates
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
      
      -- Increase referrer's referral limit by 5
      UPDATE profiles 
      SET referral_limit = referral_limit + 5
      WHERE user_id = referral_record.referrer_id;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;