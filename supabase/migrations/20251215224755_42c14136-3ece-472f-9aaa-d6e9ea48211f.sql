-- Create company_documents table with SharePoint-style metadata columns
CREATE TABLE public.company_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  document_type TEXT DEFAULT 'Other', -- Invoice, Contract, Proof, Receipt, Legal, Report
  status TEXT DEFAULT 'Draft', -- Draft, Final, Filed, Archived
  financial_value NUMERIC,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add status and risk_rating columns to companies if they don't exist
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS risk_rating TEXT DEFAULT 'Low';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS jurisdiction TEXT;

-- Enable RLS
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for company_documents
CREATE POLICY "Users can manage documents for their companies"
ON public.company_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_documents.company_id
    AND (c.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = c.id AND cu.user_id = auth.uid()
    ))
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_company_documents_updated_at
BEFORE UPDATE ON public.company_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for company documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-documents bucket
CREATE POLICY "Users can view company documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload company documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete company documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-documents' AND auth.uid() IS NOT NULL);