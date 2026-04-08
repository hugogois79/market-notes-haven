-- Add concluded field to kanban_cards
ALTER TABLE public.kanban_cards
ADD COLUMN IF NOT EXISTS concluded BOOLEAN DEFAULT false;