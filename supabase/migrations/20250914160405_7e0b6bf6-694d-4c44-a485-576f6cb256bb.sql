-- Create trigger to update avatar_url when profile images are approved
CREATE OR REPLACE FUNCTION update_profile_avatar_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update avatar_url when image is approved and it's a portrait type
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.image_type = 'portrait' THEN
    UPDATE profiles 
    SET avatar_url = NEW.file_url 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile image approval
DROP TRIGGER IF EXISTS trigger_update_avatar_on_approval ON profile_images;
CREATE TRIGGER trigger_update_avatar_on_approval
  AFTER UPDATE ON profile_images
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_avatar_on_approval();