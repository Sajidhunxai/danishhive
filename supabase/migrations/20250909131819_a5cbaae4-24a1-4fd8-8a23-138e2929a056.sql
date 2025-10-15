-- Add payment verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN payment_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN mollie_customer_id TEXT,
ADD COLUMN payment_verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_method_verified BOOLEAN DEFAULT FALSE;