-- Fix the freelancer location validation trigger to only validate when location is being set
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
  -- Only validate for freelancers AND only when location is being set/changed
  IF NEW.role = 'freelancer' AND NEW.location IS NOT NULL THEN
    -- Check if location is provided and is European
    IF NOT (NEW.location = ANY(european_countries)) THEN
      -- Log the failed attempt for security monitoring
      INSERT INTO public.profile_access_audit (
        accessed_user_id,
        accessor_user_id,
        access_type,
        created_at
      ) VALUES (
        COALESCE(NEW.user_id, auth.uid()),
        auth.uid(),
        'location_validation_failed',
        now()
      );
      
      RAISE EXCEPTION 'Kun freelancere fra Europa kan registrere sig på platformen. Tilladte lande: %', 
        array_to_string(european_countries, ', ');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;