-- Create language skills table for user language proficiencies
CREATE TABLE IF NOT EXISTS public.language_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  language_name text NOT NULL,
  proficiency_level text NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'native')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, language_code)
);

-- Enable RLS on language_skills table
ALTER TABLE public.language_skills ENABLE ROW LEVEL SECURITY;

-- Create policies for language_skills
CREATE POLICY "Users can view their own language skills" ON public.language_skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own language skills" ON public.language_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language skills" ON public.language_skills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own language skills" ON public.language_skills
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_language_skills_updated_at
  BEFORE UPDATE ON public.language_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();