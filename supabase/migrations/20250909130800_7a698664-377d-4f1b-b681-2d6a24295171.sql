-- Create phone_verifications table for storing SMS verification codes
CREATE TABLE public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (though we'll use service role key in edge functions)
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for edge functions to manage verification codes
CREATE POLICY "Service role can manage phone verifications" 
ON public.phone_verifications
FOR ALL
USING (true);

-- Create index for efficient lookups
CREATE INDEX idx_phone_verifications_phone_number ON public.phone_verifications(phone_number);
CREATE INDEX idx_phone_verifications_expires_at ON public.phone_verifications(expires_at);