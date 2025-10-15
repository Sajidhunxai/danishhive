-- Create function to check if freelancer profile is complete
CREATE OR REPLACE FUNCTION public.is_freelancer_profile_complete(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_id_param 
    AND p.role = 'freelancer'
    AND p.full_name IS NOT NULL 
    AND p.full_name != ''
    AND p.full_name != 'Incomplete Profile'
    AND p.bio IS NOT NULL 
    AND p.bio != ''
    AND p.skills IS NOT NULL 
    AND array_length(p.skills, 1) > 0
    AND p.location IS NOT NULL 
    AND p.location != ''
    AND p.hourly_rate IS NOT NULL 
    AND p.hourly_rate > 0
    AND p.phone IS NOT NULL 
    AND p.phone != ''
    AND p.phone_verified = true
    AND EXISTS (
      SELECT 1 FROM public.profile_images pi
      WHERE pi.user_id = p.user_id 
      AND pi.status = 'approved'
    )
  );
END;
$$;