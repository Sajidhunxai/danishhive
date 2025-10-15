-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verification_code text,
ADD COLUMN IF NOT EXISTS active_status boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

-- Create function to calculate and update total earnings
CREATE OR REPLACE FUNCTION public.calculate_user_total_earnings(user_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_amount numeric;
BEGIN
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

-- Create trigger to auto-calculate total earnings when earnings change
CREATE OR REPLACE FUNCTION public.update_total_earnings_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update total earnings for the affected user
  PERFORM public.calculate_user_total_earnings(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on earnings table
DROP TRIGGER IF EXISTS update_total_earnings_trigger ON earnings;
CREATE TRIGGER update_total_earnings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_total_earnings_trigger();