-- Update tags table structure
ALTER TABLE public.tags 
  ALTER COLUMN user_id SET NOT NULL,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add unique constraint for (name, user_id)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.tags ADD CONSTRAINT tags_name_user_id_unique UNIQUE (name, user_id);
  EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Create note_tags junction table
CREATE TABLE IF NOT EXISTS public.note_tags (
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (note_id, tag_id)
);

-- Enable RLS on note_tags table
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for note_tags
DROP POLICY IF EXISTS "Users can view their note tags" ON public.note_tags;
DROP POLICY IF EXISTS "Users can create note tags" ON public.note_tags;
DROP POLICY IF EXISTS "Users can delete note tags" ON public.note_tags;

CREATE POLICY "Users can view their note tags"
  ON public.note_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create note tags"
  ON public.note_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete note tags"
  ON public.note_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

-- Migrate existing tags from notes.tags array to tags and note_tags tables
DO $$
DECLARE
  note_record RECORD;
  tag_name TEXT;
  v_tag_id UUID;
BEGIN
  FOR note_record IN 
    SELECT id, user_id, tags 
    FROM public.notes 
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0 AND user_id IS NOT NULL
  LOOP
    FOREACH tag_name IN ARRAY note_record.tags
    LOOP
      -- Insert tag if it doesn't exist
      INSERT INTO public.tags (name, user_id)
      VALUES (tag_name, note_record.user_id)
      ON CONFLICT (name, user_id) DO NOTHING
      RETURNING id INTO v_tag_id;
      
      -- If tag already existed, get its id
      IF v_tag_id IS NULL THEN
        SELECT id INTO v_tag_id 
        FROM public.tags 
        WHERE name = tag_name AND user_id = note_record.user_id;
      END IF;
      
      -- Create the note-tag relationship
      IF v_tag_id IS NOT NULL THEN
        INSERT INTO public.note_tags (note_id, tag_id)
        VALUES (note_record.id, v_tag_id)
        ON CONFLICT (note_id, tag_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- Create view for tag usage counts
CREATE OR REPLACE VIEW public.tag_usage_counts AS
SELECT 
  t.id,
  t.name,
  t.user_id,
  t.category_id,
  t.color,
  t.created_at,
  t.updated_at,
  COUNT(nt.note_id) as usage_count
FROM public.tags t
LEFT JOIN public.note_tags nt ON t.id = nt.tag_id
GROUP BY t.id, t.name, t.user_id, t.category_id, t.color, t.created_at, t.updated_at;