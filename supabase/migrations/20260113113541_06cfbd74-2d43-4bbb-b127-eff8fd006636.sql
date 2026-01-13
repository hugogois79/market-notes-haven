-- Create table for linking notes to legal cases
CREATE TABLE public.legal_case_note_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(case_id, note_id)
);

-- Enable RLS
ALTER TABLE public.legal_case_note_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own case note links"
ON public.legal_case_note_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own case note links"
ON public.legal_case_note_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own case note links"
ON public.legal_case_note_links FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_legal_case_note_links_case ON public.legal_case_note_links(case_id);
CREATE INDEX idx_legal_case_note_links_note ON public.legal_case_note_links(note_id);
CREATE INDEX idx_legal_case_note_links_user ON public.legal_case_note_links(user_id);