-- Drop existing table if it exists (cleanup from previous failed migration)
DROP TABLE IF EXISTS public.role_change_requests CASCADE;

-- Add role change requests table for users to request role changes
CREATE TABLE public.role_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('freelancer', 'client')),
  current_user_role TEXT NOT NULL CHECK (current_user_role IN ('freelancer', 'client')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on role change requests
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own role change requests"
ON public.role_change_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create role change requests"
ON public.role_change_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add admin role support to profiles (only if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create security definer function to check admin status (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_user_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false) FROM public.profiles WHERE user_id = _user_id;
$$;

-- Admins can view all role change requests
CREATE POLICY "Admins can view all role change requests"
ON public.role_change_requests
FOR SELECT
USING (public.is_user_admin(auth.uid()));

-- Admins can update role change requests
CREATE POLICY "Admins can update role change requests"
ON public.role_change_requests
FOR UPDATE
USING (public.is_user_admin(auth.uid()));

-- Add trigger for role change requests timestamps
CREATE TRIGGER update_role_change_requests_updated_at
BEFORE UPDATE ON public.role_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();