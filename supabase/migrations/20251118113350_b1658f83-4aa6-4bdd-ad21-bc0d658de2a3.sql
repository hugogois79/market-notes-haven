-- Add archived column to kanban_boards table
ALTER TABLE public.kanban_boards 
ADD COLUMN archived BOOLEAN DEFAULT false NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_kanban_boards_archived ON public.kanban_boards(archived);