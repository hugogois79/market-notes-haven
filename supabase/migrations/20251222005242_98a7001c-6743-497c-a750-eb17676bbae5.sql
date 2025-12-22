-- Create table to store document AI analyses
CREATE TABLE public.document_ai_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_ai_analyses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (analyses are shared)
CREATE POLICY "Allow authenticated users to read document analyses"
ON public.document_ai_analyses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert document analyses"
ON public.document_ai_analyses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update document analyses"
ON public.document_ai_analyses
FOR UPDATE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_document_ai_analyses_updated_at
BEFORE UPDATE ON public.document_ai_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();