-- Create profile_images table to track uploaded images pending approval
CREATE TABLE public.profile_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  image_type TEXT CHECK (image_type IN ('portrait', 'logo')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

-- Users can view their own images
CREATE POLICY "Users can view their own profile images" 
ON public.profile_images
FOR SELECT
USING (auth.uid() = user_id);

-- Users can upload their own images
CREATE POLICY "Users can upload their own profile images" 
ON public.profile_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all images
CREATE POLICY "Admins can view all profile images" 
ON public.profile_images
FOR SELECT
USING (is_user_admin(auth.uid()));

-- Admins can update image status
CREATE POLICY "Admins can update profile image status" 
ON public.profile_images
FOR UPDATE
USING (is_user_admin(auth.uid()));

-- Create storage bucket for profile images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile images
CREATE POLICY "Users can upload their own profile images to storage" 
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own profile images in storage" 
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all profile images in storage" 
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-images' AND 
  is_user_admin(auth.uid())
);