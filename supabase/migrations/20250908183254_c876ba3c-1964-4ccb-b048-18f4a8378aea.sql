-- Create jobs table for customer job postings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_min NUMERIC,
  budget_max NUMERIC,
  skills_required TEXT[] DEFAULT '{}',
  project_type TEXT NOT NULL DEFAULT 'one-time',
  location TEXT,
  is_remote BOOLEAN DEFAULT true,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs
CREATE POLICY "Jobs are viewable by everyone" 
ON public.jobs 
FOR SELECT 
USING (status = 'open');

CREATE POLICY "Clients can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = client_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();