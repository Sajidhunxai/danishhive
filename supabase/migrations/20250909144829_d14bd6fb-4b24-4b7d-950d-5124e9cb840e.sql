-- Add remote work location restriction fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN remote_restriction_type text, -- 'none', 'continent', 'country'
ADD COLUMN allowed_continents text[],
ADD COLUMN allowed_countries text[];