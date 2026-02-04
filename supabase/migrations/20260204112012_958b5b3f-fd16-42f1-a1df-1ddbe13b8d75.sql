-- Add storage_path column to kanban_attachments table
ALTER TABLE public.kanban_attachments 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add a comment explaining the column's purpose
COMMENT ON COLUMN public.kanban_attachments.storage_path IS 'The relative path of the file in the kanban-attachments bucket (e.g., cardId/timestamp-hash.pdf). Used for generating signed URLs for private bucket access.';