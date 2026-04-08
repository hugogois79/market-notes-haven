
-- Add a constraint to the notes table to limit attachments to 20 files max
ALTER TABLE public.notes
ADD CONSTRAINT attachments_max_length CHECK (array_length(attachments, 1) <= 20);

-- Update existing records where attachments array might be NULL
UPDATE public.notes
SET attachments = ARRAY[]::text[]
WHERE attachments IS NULL;
