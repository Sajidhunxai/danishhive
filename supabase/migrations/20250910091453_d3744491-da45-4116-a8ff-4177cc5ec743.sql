-- Add software fields to jobs table for client requirements
ALTER TABLE public.jobs 
ADD COLUMN software_required text[] DEFAULT '{}';

-- Add software fields to profiles table for freelancer knowledge
ALTER TABLE public.profiles 
ADD COLUMN software_skills text[] DEFAULT '{}';