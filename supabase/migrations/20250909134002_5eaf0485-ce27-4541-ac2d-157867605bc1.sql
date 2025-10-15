-- Add fields for number of people needed and direct hiring option
ALTER TABLE public.jobs 
ADD COLUMN positions_available integer DEFAULT 1,
ADD COLUMN requires_approval boolean DEFAULT true;