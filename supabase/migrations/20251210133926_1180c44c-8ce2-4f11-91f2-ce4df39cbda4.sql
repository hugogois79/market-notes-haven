-- Add attachments array column to legal_documents table
ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

-- Migrate existing attachment_url data to attachments array
UPDATE public.legal_documents 
SET attachments = ARRAY[attachment_url] 
WHERE attachment_url IS NOT NULL AND (attachments IS NULL OR attachments = '{}');