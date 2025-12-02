-- Create legal_cases table
CREATE TABLE public.legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create legal_contacts table
CREATE TABLE public.legal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create legal_documents table
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  attachment_url TEXT,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  case_id UUID REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.legal_contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_cases
CREATE POLICY "Users can view their own cases"
  ON public.legal_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases"
  ON public.legal_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
  ON public.legal_cases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
  ON public.legal_cases FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for legal_contacts
CREATE POLICY "Users can view their own contacts"
  ON public.legal_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON public.legal_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.legal_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.legal_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for legal_documents
CREATE POLICY "Users can view their own documents"
  ON public.legal_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
  ON public.legal_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.legal_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.legal_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_legal_documents_case_id ON public.legal_documents(case_id);
CREATE INDEX idx_legal_documents_contact_id ON public.legal_documents(contact_id);
CREATE INDEX idx_legal_documents_user_id ON public.legal_documents(user_id);
CREATE INDEX idx_legal_cases_user_id ON public.legal_cases(user_id);
CREATE INDEX idx_legal_contacts_user_id ON public.legal_contacts(user_id);

-- Create storage bucket for legal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-documents', 'legal-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for legal-documents bucket
CREATE POLICY "Users can upload their own legal documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'legal-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own legal documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'legal-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own legal documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'legal-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create triggers for updated_at
CREATE TRIGGER update_legal_cases_updated_at
  BEFORE UPDATE ON public.legal_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_legal_contacts_updated_at
  BEFORE UPDATE ON public.legal_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();