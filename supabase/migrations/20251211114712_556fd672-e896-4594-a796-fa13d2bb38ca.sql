-- Add archived column to kanban_lists table
ALTER TABLE public.kanban_lists 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_kanban_lists_archived ON public.kanban_lists(archived);