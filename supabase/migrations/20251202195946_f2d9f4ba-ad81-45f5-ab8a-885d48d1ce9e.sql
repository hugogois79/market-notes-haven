-- Create junction table for direct contact-case relationships
CREATE TABLE public.legal_contact_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.legal_contacts(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, case_id)
);

-- Enable RLS
ALTER TABLE public.legal_contact_cases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own contact-case relationships"
  ON public.legal_contact_cases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.legal_contacts 
      WHERE id = legal_contact_cases.contact_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own contact-case relationships"
  ON public.legal_contact_cases
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.legal_contacts 
      WHERE id = legal_contact_cases.contact_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own contact-case relationships"
  ON public.legal_contact_cases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.legal_contacts 
      WHERE id = legal_contact_cases.contact_id 
      AND user_id = auth.uid()
    )
  );