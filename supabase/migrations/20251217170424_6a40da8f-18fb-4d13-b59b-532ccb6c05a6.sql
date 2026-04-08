-- Add indexes to improve query performance on Notes module

-- Index for notes table - user_id is used in all RLS policies and queries
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- Index for notes created_at for sorting
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- Index for notes updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- Index for notes category filtering
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category);

-- Index for categories table - user_id filtering
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- Index for tags table - user_id filtering
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

-- Index for note_tags junction table - for efficient joins
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);

-- Composite index for note_tags for lookups
CREATE INDEX IF NOT EXISTS idx_note_tags_composite ON public.note_tags(note_id, tag_id);