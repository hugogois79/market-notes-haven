-- Create workflow file search index table
CREATE TABLE IF NOT EXISTS public.workflow_file_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.workflow_files(id) ON DELETE CASCADE,
  search_text TEXT NOT NULL,
  tokens TSVECTOR GENERATED ALWAYS AS (to_tsvector('portuguese', search_text)) STORED,
  indexed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_id)
);

-- Enable RLS
ALTER TABLE public.workflow_file_index ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own indexed files
CREATE POLICY "Users can view their own indexed files"
ON public.workflow_file_index
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workflow_files wf
    WHERE wf.id = file_id AND wf.user_id = auth.uid()
  )
);

-- Create GIN index for fast full-text search
CREATE INDEX idx_workflow_file_index_tokens ON public.workflow_file_index USING GIN(tokens);

-- Create index for faster file lookups
CREATE INDEX idx_workflow_file_index_file_id ON public.workflow_file_index(file_id);

-- Create function to get last index run time
CREATE OR REPLACE FUNCTION public.get_workflow_index_stats()
RETURNS TABLE(
  total_indexed BIGINT,
  last_indexed_at TIMESTAMP WITH TIME ZONE,
  pending_files BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    (SELECT COUNT(*) FROM workflow_file_index) as total_indexed,
    (SELECT MAX(indexed_at) FROM workflow_file_index) as last_indexed_at,
    (SELECT COUNT(*) FROM workflow_files wf 
     WHERE NOT EXISTS (SELECT 1 FROM workflow_file_index wfi WHERE wfi.file_id = wf.id)) as pending_files;
$$;