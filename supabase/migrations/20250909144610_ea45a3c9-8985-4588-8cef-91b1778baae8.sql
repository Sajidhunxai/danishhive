-- Create storage policies for job-attachments bucket
-- Allow authenticated users to upload files to job-attachments bucket
CREATE POLICY "Users can upload job attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'job-attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view their own uploaded files
CREATE POLICY "Users can view their own job attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'job-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own uploaded files
CREATE POLICY "Users can delete their own job attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'job-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);