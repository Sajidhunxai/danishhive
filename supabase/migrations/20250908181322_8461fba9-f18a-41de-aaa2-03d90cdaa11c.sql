-- Add address and verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN mitid_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN mitid_verification_date TIMESTAMP WITH TIME ZONE;