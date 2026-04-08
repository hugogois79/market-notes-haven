-- Create note_relations table for linking notes together
CREATE TABLE public.note_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'related',
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_note_id, target_note_id),
  CONSTRAINT no_self_relation CHECK (source_note_id != target_note_id)
);

-- Enable RLS
ALTER TABLE public.note_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their note relations"
ON public.note_relations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their note relations"
ON public.note_relations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their note relations"
ON public.note_relations FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_note_relations_source ON public.note_relations(source_note_id);
CREATE INDEX idx_note_relations_target ON public.note_relations(target_note_id);
CREATE INDEX idx_note_relations_user ON public.note_relations(user_id);