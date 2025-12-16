-- Add tags column to kanban_cards table
ALTER TABLE public.kanban_cards 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';