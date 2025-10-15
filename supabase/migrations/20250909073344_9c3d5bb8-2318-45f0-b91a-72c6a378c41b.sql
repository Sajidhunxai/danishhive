-- Create earnings table to track freelancer payments
CREATE TABLE public.earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DKK',
  payment_period_start DATE NOT NULL,
  payment_period_end DATE NOT NULL,
  payout_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  mollie_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for earnings access
CREATE POLICY "Users can view their own earnings" 
ON public.earnings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own earnings" 
ON public.earnings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own earnings" 
ON public.earnings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_earnings_updated_at
BEFORE UPDATE ON public.earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint to jobs table
ALTER TABLE public.earnings 
ADD CONSTRAINT earnings_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;