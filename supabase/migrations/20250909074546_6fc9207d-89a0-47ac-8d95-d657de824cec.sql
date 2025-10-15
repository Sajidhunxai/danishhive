-- Create contracts table for job-based contract management
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  freelancer_id UUID,
  contract_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  terms TEXT,
  payment_terms TEXT,
  deadline DATE,
  total_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'draft',
  template_id UUID,
  file_url TEXT,
  client_signature_date TIMESTAMP WITH TIME ZONE,
  freelancer_signature_date TIMESTAMP WITH TIME ZONE,
  client_signature_data TEXT,
  freelancer_signature_data TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contract templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  default_terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category TEXT DEFAULT 'general',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contract attachments table
CREATE TABLE public.contract_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contracts
CREATE POLICY "Users can view contracts they're involved in" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

CREATE POLICY "Clients can create contracts for their jobs" 
ON public.contracts 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Contract parties can update contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Create RLS policies for contract templates
CREATE POLICY "Everyone can view active templates" 
ON public.contract_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can create templates" 
ON public.contract_templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Template creators can update their templates" 
ON public.contract_templates 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create RLS policies for contract attachments
CREATE POLICY "Contract parties can view attachments" 
ON public.contract_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contracts.id = contract_attachments.contract_id 
    AND (contracts.client_id = auth.uid() OR contracts.freelancer_id = auth.uid())
  )
);

CREATE POLICY "Contract parties can upload attachments" 
ON public.contract_attachments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contracts.id = contract_attachments.contract_id 
    AND (contracts.client_id = auth.uid() OR contracts.freelancer_id = auth.uid())
  )
);

-- Create function to generate unique contract numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  contract_num TEXT;
  year_suffix TEXT;
  counter INTEGER;
BEGIN
  -- Get current year suffix
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next counter for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN contract_number ~ ('^CNT-' || year_suffix || '-[0-9]+$')
      THEN CAST(SPLIT_PART(contract_number, '-', 3) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO counter
  FROM public.contracts;
  
  -- Format: CNT-YY-NNNN
  contract_num := 'CNT-' || year_suffix || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN contract_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contract templates
INSERT INTO public.contract_templates (name, description, content, default_terms, category) VALUES
(
  'Standard Freelance Kontrakt',
  'Standard skabelon til freelance opgaver',
  'FREELANCE KONTRAKT

Mellem:
KLIENT: [Klient Navn]
FREELANCER: [Freelancer Navn]

OPGAVE BESKRIVELSE:
[Opgave Titel]
[Detaljeret beskrivelse af opgaven]

LEVERANCER:
- [Specifik leverance 1]
- [Specifik leverance 2]

TIDSPLAN:
Start dato: [Start Dato]
Slutdato: [Slut Dato]

BETALING:
Samlet beløb: [Total Beløb] DKK
Betalingsbetingelser: [Betalingsbetingelser]',
  '1. Freelanceren forpligter sig til at levere arbejdet inden for den aftalte tidsramme
2. Klienten forpligter sig til betaling inden for 30 dage efter levering
3. Eventuelle ændringer til projektet skal aftales skriftligt
4. Ophavsret overdrages til klienten ved fuld betaling
5. Fortrolighed: Begge parter forpligter sig til at holde projektoplysninger fortrolige',
  'freelance'
),
(
  'Konsulentydelse Kontrakt',
  'Kontrakt til konsulentarbejde og rådgivning',
  'KONSULENTKONTRAKT

KONSULENT: [Freelancer Navn]
KLIENT: [Klient Navn]

KONSULENTYDELSE:
[Beskrivelse af konsulentydelsen]

VARIGHED:
Fra: [Start Dato]
Til: [Slut Dato]

HONORAR:
Timepris: [Timepris] DKK
Estimeret antal timer: [Timer]

RAPPORTERING:
- Månedlig rapportering af udført arbejde
- Timeregistrering skal dokumenteres',
  '1. Konsulenten arbejder som selvstændig entreprenør
2. Betaling sker månedligt bagud
3. Rejseudgifter dækkes efter forudgående aftale
4. Konsulenten er ansvarlig for egen forsikring
5. Begge parter kan opsige kontrakten med 30 dages varsel',
  'consulting'
);