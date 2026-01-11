-- Index on user_id for faster RLS filtering when fetching all user's relations
CREATE INDEX IF NOT EXISTS idx_note_relations_user_id ON public.note_relations(user_id);

-- Composite index for user + source for faster lookups
CREATE INDEX IF NOT EXISTS idx_note_relations_user_source ON public.note_relations(user_id, source_note_id);

-- Composite index for user + target for faster lookups  
CREATE INDEX IF NOT EXISTS idx_note_relations_user_target ON public.note_relations(user_id, target_note_id);