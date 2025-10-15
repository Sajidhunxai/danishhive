-- Add payment method and PayPal fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN payment_method TEXT DEFAULT 'danish_bank' CHECK (payment_method IN ('danish_bank', 'iban', 'paypal')),
ADD COLUMN paypal_email TEXT;

-- Add comments to describe the new fields
COMMENT ON COLUMN public.profiles.payment_method IS 'Payment method preference: danish_bank, iban, or paypal';
COMMENT ON COLUMN public.profiles.paypal_email IS 'PayPal email address for payments';