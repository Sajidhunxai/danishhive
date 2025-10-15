-- Add completed status to jobs and add payment fields
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS freelancer_id UUID,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update the jobs status to include more options
-- Current default is 'open', let's add 'assigned', 'in_progress', 'completed', 'cancelled'