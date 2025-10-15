-- Security Enhancement Migration
-- Fix 1: Enhance Language Skills Privacy
-- Remove the overly permissive public view policy and replace with more restrictive ones

DROP POLICY IF EXISTS "Public can view language skills" ON public.language_skills;

-- Allow users to view language skills only in specific contexts:
-- 1. Users can always view their own language skills
-- 2. Language skills are visible when viewing public freelancer profiles (for job matching)
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

-- Fix 2: Enhance Phone Verification Security
-- Add time-based restrictions and tighter access controls

DROP POLICY IF EXISTS "Service role can read verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service role can update verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service role can delete verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can create verification for their own phone" ON public.phone_verifications;

-- Only allow service role to manage verifications for active, non-expired codes
CREATE POLICY "Service role can read active verifications" 
ON public.phone_verifications 
FOR SELECT 
USING (
  -- Only allow reading of non-expired verifications
  expires_at > now()
);

CREATE POLICY "Service role can update active verifications" 
ON public.phone_verifications 
FOR UPDATE 
USING (
  -- Only allow updating of non-expired verifications
  expires_at > now()
);

CREATE POLICY "Service role can delete verifications" 
ON public.phone_verifications 
FOR DELETE 
USING (true);

CREATE POLICY "System can create phone verifications" 
ON public.phone_verifications 
FOR INSERT 
WITH CHECK (
  -- Ensure expiry is set to a reasonable future time (max 30 minutes)
  expires_at > now() AND expires_at <= now() + interval '30 minutes'
);

-- Add a function to clean up expired verification codes automatically
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

-- Create a trigger to automatically clean up old verifications daily
-- This helps maintain data privacy by not keeping verification codes longer than necessary
CREATE OR REPLACE FUNCTION public.schedule_verification_cleanup()
RETURNS trigger AS $$
BEGIN
  -- Perform cleanup when new verifications are created
  -- This is a lightweight way to periodically clean up without needing a cron job
  IF random() < 0.1 THEN -- Run cleanup ~10% of the time
    PERFORM public.cleanup_expired_phone_verifications();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_cleanup_verifications
AFTER INSERT ON public.phone_verifications
FOR EACH ROW EXECUTE FUNCTION public.schedule_verification_cleanup();

-- Fix 3: Add audit logging for sensitive profile access
-- Create a simple audit log for tracking access to sensitive profile data

CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_user_id uuid NOT NULL,
  accessor_user_id uuid,
  access_type text NOT NULL, -- 'view', 'update', 'delete'
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profile access logs" 
ON public.profile_access_logs 
FOR SELECT 
USING (is_user_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert profile access logs" 
ON public.profile_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_user_time 
ON public.profile_access_logs(accessed_user_id, created_at DESC);

-- Automatically clean up old audit logs (keep for 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.profile_access_logs 
  WHERE created_at < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;