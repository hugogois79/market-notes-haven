-- Add archived and completed columns to kanban_cards
ALTER TABLE public.kanban_cards 
ADD COLUMN archived BOOLEAN DEFAULT false,
ADD COLUMN completed BOOLEAN DEFAULT false,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;