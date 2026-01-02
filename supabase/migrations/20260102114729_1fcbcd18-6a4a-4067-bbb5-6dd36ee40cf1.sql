-- Create work_folders table for Work entity folder structure
CREATE TABLE public.work_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.work_folders(id) ON DELETE CASCADE,
  category TEXT,
  status TEXT,
  category_options JSONB DEFAULT '[]'::jsonb,
  status_options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_documents table for Work entity documents
CREATE TABLE public.work_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.work_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  document_type TEXT DEFAULT 'Other'::text,
  status TEXT DEFAULT 'Draft'::text,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  notes TEXT,
  financial_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_folders
CREATE POLICY "Users can view their own work folders"
  ON public.work_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work folders"
  ON public.work_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work folders"
  ON public.work_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work folders"
  ON public.work_folders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for work_documents
CREATE POLICY "Users can view their own work documents"
  ON public.work_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work documents"
  ON public.work_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work documents"
  ON public.work_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work documents"
  ON public.work_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_work_folders_user_id ON public.work_folders(user_id);
CREATE INDEX idx_work_folders_parent ON public.work_folders(parent_folder_id);
CREATE INDEX idx_work_documents_user_id ON public.work_documents(user_id);
CREATE INDEX idx_work_documents_folder ON public.work_documents(folder_id);