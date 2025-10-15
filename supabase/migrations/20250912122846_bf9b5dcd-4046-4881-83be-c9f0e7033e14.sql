-- Add still_working_here column to projects table
ALTER TABLE public.projects 
ADD COLUMN still_working_here boolean DEFAULT false;