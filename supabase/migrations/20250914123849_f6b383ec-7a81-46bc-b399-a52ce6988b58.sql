-- Add function to validate European freelancers only
CREATE OR REPLACE FUNCTION public.validate_freelancer_location()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  european_countries TEXT[] := ARRAY[
    'Danmark', 'Norge', 'Sverige', 'Finland', 'Tyskland', 'Frankrig',
    'Storbritannien', 'Italien', 'Spanien', 'Holland', 'Belgien',
    'Østrig', 'Schweiz', 'Polen', 'Tjekkiet', 'Portugal', 'Irland'
  ];
BEGIN
  -- Only validate for freelancers
  IF NEW.role = 'freelancer' THEN
    -- Check if location is provided and is European
    IF NEW.location IS NULL OR NOT (NEW.location = ANY(european_countries)) THEN
      RAISE EXCEPTION 'Kun freelancere fra Europa kan registrere sig på platformen. Tilladte lande: %', 
        array_to_string(european_countries, ', ');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate freelancer location on insert and update
DROP TRIGGER IF EXISTS trigger_validate_freelancer_location ON public.profiles;
CREATE TRIGGER trigger_validate_freelancer_location
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_freelancer_location();