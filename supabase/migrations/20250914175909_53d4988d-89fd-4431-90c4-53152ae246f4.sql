-- Fix security vulnerability: Remove public access to jobs table and implement proper authentication-based RLS

-- Drop existing public access policies
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Public can view completed jobs for history" ON public.jobs;

-- Create new secure RLS policies for authenticated users only

-- Policy 1: Job owners (clients) can view all their own jobs regardless of status
CREATE POLICY "Clients can view their own jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- Policy 2: Assigned freelancers can view jobs they're working on
CREATE POLICY "Assigned freelancers can view their jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (auth.uid() = freelancer_id AND freelancer_id IS NOT NULL);

-- Policy 3: Authenticated freelancers can view only open jobs (for browsing available work)
-- But limit sensitive information exposure by requiring complete profiles
CREATE POLICY "Authenticated freelancers can view open jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  status = 'open' 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'freelancer'
    AND is_freelancer_profile_complete(auth.uid())
  )
);

-- Policy 4: Admins can view all jobs for management purposes
CREATE POLICY "Admins can view all jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (is_user_admin(auth.uid()));

-- Policy 5: Job applicants can view jobs they've applied to
CREATE POLICY "Job applicants can view applied jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM job_applications 
    WHERE job_id = jobs.id 
    AND applicant_id = auth.uid()
  )
);

-- Add audit logging for job access (optional security enhancement)
CREATE OR REPLACE FUNCTION public.log_job_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log job access for security monitoring
  INSERT INTO public.profile_access_audit (
    accessed_user_id,
    accessor_user_id,
    access_type,
    created_at
  ) VALUES (
    NEW.client_id,
    auth.uid(),
    'job_view_' || NEW.status,
    now()
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail if logging fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;