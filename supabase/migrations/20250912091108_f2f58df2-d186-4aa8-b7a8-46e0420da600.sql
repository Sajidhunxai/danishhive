-- Add birthday field to profiles table
ALTER TABLE public.profiles ADD COLUMN birthday DATE;

-- Create table for under-18 applicants
CREATE TABLE public.under_18_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  birthday DATE NOT NULL,
  language_skills TEXT[] DEFAULT '{}',
  software_skills TEXT[] DEFAULT '{}',
  code_languages TEXT[] DEFAULT '{}',
  education_institution TEXT,
  cv_file_path TEXT,
  cv_file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on under_18_applications table
ALTER TABLE public.under_18_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for under_18_applications
CREATE POLICY "Anyone can submit under-18 applications" 
ON public.under_18_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all under-18 applications" 
ON public.under_18_applications 
FOR SELECT 
USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can update under-18 applications" 
ON public.under_18_applications 
FOR UPDATE 
USING (is_user_admin(auth.uid()));

-- Create table for Danish universities
CREATE TABLE public.danish_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  type TEXT DEFAULT 'university' CHECK (type IN ('university', 'business_academy', 'university_college')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on danish_universities (public read access)
ALTER TABLE public.danish_universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view universities" 
ON public.danish_universities 
FOR SELECT 
USING (true);

-- Insert Danish universities
INSERT INTO public.danish_universities (name, city, type) VALUES
-- Universities
('Københavns Universitet', 'København', 'university'),
('Aarhus Universitet', 'Aarhus', 'university'),
('Syddansk Universitet', 'Odense', 'university'),
('Roskilde Universitet', 'Roskilde', 'university'),
('Aalborg Universitet', 'Aalborg', 'university'),
('Danmarks Tekniske Universitet (DTU)', 'Lyngby', 'university'),
('Copenhagen Business School (CBS)', 'København', 'university'),
('IT-Universitetet i København', 'København', 'university'),

-- University Colleges
('University College København (KP)', 'København', 'university_college'),
('University College Sjælland (UCSJ)', 'Sorø', 'university_college'),
('University College Syddanmark (UCSyd)', 'Esbjerg', 'university_college'),
('VIA University College', 'Aarhus', 'university_college'),
('University College Nordjylland (UCN)', 'Aalborg', 'university_college'),
('University College Lillebælt (UCL)', 'Odense', 'university_college'),
('Professionshøjskolen Absalon', 'Sorø', 'university_college'),
('Zealand - Sjællands Erhvervsakademi', 'Roskilde', 'university_college'),

-- Business Academies
('Copenhagen Business Academy (Cphbusiness)', 'København', 'business_academy'),
('Business Academy Aarhus', 'Aarhus', 'business_academy'),
('Business Academy SouthWest (EASV)', 'Esbjerg', 'business_academy'),
('Zealand Business College', 'Næstved', 'business_academy'),
('Business Academy MidtVest', 'Herning', 'business_academy'),
('Erhvervsakademi Dania', 'Randers', 'business_academy'),
('Erhvervsakademi Sjælland', 'Slagelse', 'business_academy'),
('Business Academy North (Erhvervsakademi Nord)', 'Hjørring', 'business_academy');

-- Create trigger for updated_at on under_18_applications
CREATE TRIGGER update_under_18_applications_updated_at
  BEFORE UPDATE ON public.under_18_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();