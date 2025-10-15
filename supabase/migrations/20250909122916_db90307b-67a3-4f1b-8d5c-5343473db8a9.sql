-- Create profile reports table
CREATE TABLE public.profile_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL,
  report_reason TEXT NOT NULL,
  report_category TEXT NOT NULL DEFAULT 'inappropriate_behavior',
  description TEXT,
  conversation_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own reports
CREATE POLICY "Users can create reports"
ON public.profile_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.profile_reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.profile_reports
FOR SELECT
USING (is_user_admin(auth.uid()));

-- Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.profile_reports
FOR UPDATE
USING (is_user_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_profile_reports_updated_at
  BEFORE UPDATE ON public.profile_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_profile_reports_status ON public.profile_reports(status);
CREATE INDEX idx_profile_reports_reported_user ON public.profile_reports(reported_user_id);
CREATE INDEX idx_profile_reports_reporter ON public.profile_reports(reporter_id);