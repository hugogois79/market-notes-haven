-- Create indexes to optimize notes filtering by project, category, and tags
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON public.notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_project ON public.notes(user_id, project_id);

-- Create indexes for note_tags junction table
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_notes_user_category ON public.notes(user_id, category);