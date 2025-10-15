-- Add new Danish bank fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN registration_number TEXT,
ADD COLUMN account_number TEXT;

-- Add comment to describe the new fields
COMMENT ON COLUMN public.profiles.registration_number IS 'Danish bank registration number (4 digits)';
COMMENT ON COLUMN public.profiles.account_number IS 'Danish bank account number (up to 10 digits)';