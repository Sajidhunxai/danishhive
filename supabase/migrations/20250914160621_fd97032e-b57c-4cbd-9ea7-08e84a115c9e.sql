-- Fix security warning: Set search path for the function
CREATE OR REPLACE FUNCTION update_profile_avatar_on_approval()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only update avatar_url when image is approved and it's a portrait type
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.image_type = 'portrait' THEN
    UPDATE profiles 
    SET avatar_url = NEW.file_url 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;