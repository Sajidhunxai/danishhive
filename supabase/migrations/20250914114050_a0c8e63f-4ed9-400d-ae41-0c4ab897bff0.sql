-- Sikre at kun Lucca kan være admin
-- Først fjern admin fra alle andre brugere
UPDATE public.profiles 
SET is_admin = false, role = 'freelancer'
WHERE is_admin = true AND user_id != (
  SELECT user_id FROM profiles 
  WHERE full_name = 'Lucca' 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Sørg for at Lucca er sat som admin (hvis han ikke allerede er)
UPDATE public.profiles 
SET is_admin = true, role = 'admin'
WHERE full_name = 'Lucca' 
AND user_id = (
  SELECT user_id FROM profiles 
  WHERE full_name = 'Lucca' 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Opret en sikkerhedsfunktion der forhindrer andre i at blive admin
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_admin()
RETURNS TRIGGER AS $$
DECLARE
  lucca_user_id UUID;
BEGIN
  -- Find Luccas bruger ID
  SELECT user_id INTO lucca_user_id 
  FROM public.profiles 
  WHERE full_name = 'Lucca' 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Hvis nogen prøver at sætte is_admin = true og det ikke er Lucca
  IF NEW.is_admin = true AND NEW.user_id != lucca_user_id THEN
    NEW.is_admin = false;
    NEW.role = COALESCE(OLD.role, 'freelancer');
  END IF;
  
  -- Hvis nogen prøver at sætte Luccas is_admin til false, forhindr det
  IF NEW.user_id = lucca_user_id AND NEW.is_admin = false THEN
    NEW.is_admin = true;
    NEW.role = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;