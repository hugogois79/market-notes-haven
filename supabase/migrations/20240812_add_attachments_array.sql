
-- Add attachments array column to notes table if it doesn't exist already
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE public.notes ADD COLUMN attachments TEXT[] DEFAULT array[]::text[];
  END IF;
END $$;
