-- Add file_hash column for forensic integrity verification
ALTER TABLE public.company_documents
ADD COLUMN file_hash text;

-- Add comment explaining the column
COMMENT ON COLUMN public.company_documents.file_hash IS 'SHA-256 hash for forensic integrity verification';