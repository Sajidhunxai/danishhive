-- Update contracts table policy to require payment verification
DROP POLICY IF EXISTS "Clients can create contracts for their jobs" ON public.contracts;

CREATE POLICY "Payment verified clients can create contracts for their jobs" 
ON public.contracts 
FOR INSERT 
WITH CHECK (
  auth.uid() = client_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND payment_verified = true
  )
);