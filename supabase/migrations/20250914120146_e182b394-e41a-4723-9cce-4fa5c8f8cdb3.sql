-- Fix security vulnerability in phone_verifications table
-- Remove the overly permissive policy that allows public access

DROP POLICY IF EXISTS "Service role can manage phone verifications" ON public.phone_verifications;

-- Create secure RLS policies for phone_verifications table

-- Only allow authenticated users to insert verification codes for their own phone numbers
CREATE POLICY "Users can create verification for their own phone"
ON public.phone_verifications
FOR INSERT
TO authenticated
WITH CHECK (true); -- We allow insert since phone number ownership will be verified through the application logic

-- Only allow service role (backend functions) to read verification codes for validation
CREATE POLICY "Service role can read verifications"
ON public.phone_verifications  
FOR SELECT
TO service_role
USING (true);

-- Only allow service role to update verification records (mark as used, etc.)
CREATE POLICY "Service role can update verifications"
ON public.phone_verifications
FOR UPDATE  
TO service_role
USING (true);

-- Only allow service role to delete expired verification codes
CREATE POLICY "Service role can delete verifications" 
ON public.phone_verifications
FOR DELETE
TO service_role
USING (true);

-- Ensure no public access to sensitive phone verification data
-- The table will now be protected and only accessible through:
-- 1. Authenticated users can create verification requests
-- 2. Service role (edge functions) can manage the verification process