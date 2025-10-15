-- Create storage bucket for job attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('job-attachments', 'job-attachments', false);

-- Create storage policies for job attachments
CREATE POLICY "Authenticated users can upload job attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'job-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Job parties can view attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'job-attachments' AND (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id::text = (storage.foldername(name))[1] 
    AND (jobs.client_id = auth.uid() OR jobs.freelancer_id = auth.uid())
  ) OR 
  is_user_admin(auth.uid())
));

CREATE POLICY "Clients can update their job attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'job-attachments' AND EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id::text = (storage.foldername(name))[1] 
  AND jobs.client_id = auth.uid()
));

-- Create job_attachments table
CREATE TABLE public.job_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  is_guideline boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on job_attachments
ALTER TABLE public.job_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_attachments
CREATE POLICY "Job parties can view attachments" 
ON public.job_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_attachments.job_id 
    AND (jobs.client_id = auth.uid() OR jobs.freelancer_id = auth.uid())
  ) OR 
  is_user_admin(auth.uid())
);

CREATE POLICY "Clients can manage their job attachments" 
ON public.job_attachments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_attachments.job_id 
    AND jobs.client_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_attachments.job_id 
    AND jobs.client_id = auth.uid()
  )
);

-- Create attachment_translations table
CREATE TABLE public.attachment_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attachment_id uuid NOT NULL REFERENCES public.job_attachments(id) ON DELETE CASCADE,
  target_language text NOT NULL,
  translated_file_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'rejected')),
  assigned_to uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(attachment_id, target_language)
);

-- Enable RLS on attachment_translations
ALTER TABLE public.attachment_translations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attachment_translations
CREATE POLICY "Admins can manage all translations" 
ON public.attachment_translations 
FOR ALL 
USING (is_user_admin(auth.uid())) 
WITH CHECK (is_user_admin(auth.uid()));

CREATE POLICY "Assigned translators can view their assignments" 
ON public.attachment_translations 
FOR SELECT 
USING (auth.uid() = assigned_to);

CREATE POLICY "Assigned translators can update their assignments" 
ON public.attachment_translations 
FOR UPDATE 
USING (auth.uid() = assigned_to AND status IN ('assigned', 'in_progress'));

-- Create triggers for updated_at
CREATE TRIGGER update_job_attachments_updated_at
  BEFORE UPDATE ON public.job_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attachment_translations_updated_at
  BEFORE UPDATE ON public.attachment_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();