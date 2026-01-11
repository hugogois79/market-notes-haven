-- Create indexes on notes table for faster access

-- Index for user_id (most common filter - RLS and user queries)
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category);

-- Index for sorting by dates
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- Composite index for the most common query pattern (user's notes sorted by update)
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON public.notes(user_id, updated_at DESC);

-- Composite index for user's notes sorted by creation
CREATE INDEX IF NOT EXISTS idx_notes_user_created ON public.notes(user_id, created_at DESC);

-- Index for project filtering
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON public.notes(project_id);

-- Composite index for user + project filtering
CREATE INDEX IF NOT EXISTS idx_notes_user_project ON public.notes(user_id, project_id);

-- Index on note_relations for faster relation lookups
CREATE INDEX IF NOT EXISTS idx_note_relations_source ON public.note_relations(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_relations_target ON public.note_relations(target_note_id);

-- Index on note_tags for faster tag lookups
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);