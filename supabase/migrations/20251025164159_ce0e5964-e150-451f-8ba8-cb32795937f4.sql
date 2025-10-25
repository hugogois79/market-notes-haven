-- Add tasks column to kanban_cards table
ALTER TABLE public.kanban_cards 
ADD COLUMN tasks JSONB DEFAULT '[]'::jsonb;