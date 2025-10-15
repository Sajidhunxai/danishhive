-- Security Enhancement Migration - Fixed Version
-- Handle existing policies properly

-- Fix 1: Enhance Language Skills Privacy
-- First drop all existing policies on language_skills table
DROP POLICY IF EXISTS "Public can view language skills" ON public.language_skills;
DROP POLICY IF EXISTS "Users can view their own language skills" ON public.language_skills;
DROP POLICY IF EXISTS "Users can insert their own language skills" ON public.language_skills;
DROP POLICY IF EXISTS "Users can update their own language skills" ON public.language_skills;
DROP POLICY IF EXISTS "Users can delete their own language skills" ON public.language_skills;

-- Recreate with enhanced security
CREATE POLICY "Users can view their own language skills" 
ON public.language_skills 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Language skills visible for active freelancer profiles" 
ON public.language_skills 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = language_skills.user_id 
    AND p.role = 'freelancer' 
    AND p.active_status = true
    AND p.full_name IS NOT NULL 
    AND p.full_name != ''
    AND p.full_name != 'Incomplete Profile'
  )
);

-- Keep the existing management policies
CREATE POLICY "Users can insert their own language skills" 
ON public.language_skills 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language skills" 
ON public.language_skills 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own language skills" 
ON public.language_skills 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix 2: Enhance Phone Verification Security
-- Drop all existing policies first
DROP POLICY IF EXISTS "Service role can read verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service role can update verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service role can delete verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can create verification for their own phone" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service role can read active verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service role can update active verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "System can create phone verifications" ON public.phone_verifications;

-- Create enhanced policies with time-based restrictions
CREATE POLICY "Service role can read active verifications" 
ON public.phone_verifications 
FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Service role can update active verifications" 
ON public.phone_verifications 
FOR UPDATE 
USING (expires_at > now());

CREATE POLICY "Service role can delete verifications" 
ON public.phone_verifications 
FOR DELETE 
USING (true);

CREATE POLICY "System can create phone verifications" 
ON public.phone_verifications 
FOR INSERT 
WITH CHECK (
  expires_at > now() AND expires_at <= now() + interval '30 minutes'
);

-- Add cleanup function for expired verifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_phone_verifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.phone_verifications 
  WHERE expires_at < now() - interval '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit logging table
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_user_id uuid NOT NULL,
  accessor_user_id uuid,
  access_type text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit logs
CREATE POLICY "Admins can view profile access logs" 
ON public.profile_access_logs 
FOR SELECT 
USING (is_user_admin(auth.uid()));

CREATE POLICY "System can insert profile access logs" 
ON public.profile_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Add performance index
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_user_time 
ON public.profile_access_logs(accessed_user_id, created_at DESC);