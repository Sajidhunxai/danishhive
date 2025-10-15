-- Allow public viewing of projects for portfolio purposes
CREATE POLICY "Public can view projects for portfolio" 
ON public.projects 
FOR SELECT 
USING (true);

-- Allow public viewing of language skills
CREATE POLICY "Public can view language skills" 
ON public.language_skills 
FOR SELECT 
USING (true);

-- Allow public viewing of completed jobs for work history
CREATE POLICY "Public can view completed jobs for history" 
ON public.jobs 
FOR SELECT 
USING (status = 'completed');