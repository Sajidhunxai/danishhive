-- Add foreign key constraints to job_applications table
ALTER TABLE public.job_applications 
  ADD CONSTRAINT job_applications_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.job_applications 
  ADD CONSTRAINT job_applications_applicant_id_fkey 
  FOREIGN KEY (applicant_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;