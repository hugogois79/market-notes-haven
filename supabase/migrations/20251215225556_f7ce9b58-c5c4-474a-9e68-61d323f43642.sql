-- Create company_folders table for folder hierarchy
CREATE TABLE public.company_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.company_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to company_documents
ALTER TABLE public.company_documents 
ADD COLUMN folder_id UUID REFERENCES public.company_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.company_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_folders
CREATE POLICY "Users can view folders of their companies"
ON public.company_folders FOR SELECT
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create folders in their companies"
ON public.company_folders FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update folders in their companies"
ON public.company_folders FOR UPDATE
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete folders in their companies"
ON public.company_folders FOR DELETE
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
  )
);

-- Create index for folder queries
CREATE INDEX idx_company_folders_company ON public.company_folders(company_id);
CREATE INDEX idx_company_folders_parent ON public.company_folders(parent_folder_id);
CREATE INDEX idx_company_documents_folder ON public.company_documents(folder_id);