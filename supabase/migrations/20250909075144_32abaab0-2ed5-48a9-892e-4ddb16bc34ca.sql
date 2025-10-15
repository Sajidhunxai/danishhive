-- Fix search_path for SECURITY DEFINER functions to prevent search path attacks

-- Update functions that don't have proper search_path set
CREATE OR REPLACE FUNCTION public.create_earning_on_job_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if job status changed to 'completed' and freelancer_id and final_amount are set
  IF NEW.status = 'completed' 
     AND OLD.status != 'completed' 
     AND NEW.freelancer_id IS NOT NULL 
     AND NEW.final_amount IS NOT NULL THEN
    
    -- Calculate current payment period (19th to 19th)
    DECLARE
      period_start DATE;
      period_end DATE;
      payout_date DATE;
      current_date DATE := CURRENT_DATE;
    BEGIN
      -- Calculate payment period
      IF EXTRACT(DAY FROM current_date) >= 19 THEN
        period_start := DATE_TRUNC('month', current_date) + INTERVAL '18 days';
        period_end := DATE_TRUNC('month', current_date + INTERVAL '1 month') + INTERVAL '18 days';
        payout_date := DATE_TRUNC('month', current_date + INTERVAL '2 months');
      ELSE
        period_start := DATE_TRUNC('month', current_date - INTERVAL '1 month') + INTERVAL '18 days';
        period_end := DATE_TRUNC('month', current_date) + INTERVAL '18 days';
        payout_date := DATE_TRUNC('month', current_date + INTERVAL '1 month');
      END IF;
      
      -- Insert earning record
      INSERT INTO public.earnings (
        user_id,
        job_id,
        amount,
        currency,
        payment_period_start,
        payment_period_end,
        payout_date,
        status,
        description,
        created_at,
        updated_at
      ) VALUES (
        NEW.freelancer_id,
        NEW.id,
        NEW.final_amount,
        'DKK',
        period_start,
        period_end,
        payout_date,
        'pending',
        'Indtægt fra opgave: ' || NEW.title,
        NOW(),
        NOW()
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;