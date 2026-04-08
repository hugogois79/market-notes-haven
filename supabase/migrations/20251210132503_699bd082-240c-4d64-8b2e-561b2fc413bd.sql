-- Create junction table for many-to-many relationship between documents and contacts
CREATE TABLE IF NOT EXISTS public.legal_document_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.legal_contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.legal_document_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own document contacts"
  ON public.legal_document_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.legal_documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own document contacts"
  ON public.legal_document_contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.legal_documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own document contacts"
  ON public.legal_document_contacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.legal_documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- Migrate existing contact_id data to the new junction table
INSERT INTO public.legal_document_contacts (document_id, contact_id)
SELECT id, contact_id
FROM public.legal_documents
WHERE contact_id IS NOT NULL
ON CONFLICT DO NOTHING;