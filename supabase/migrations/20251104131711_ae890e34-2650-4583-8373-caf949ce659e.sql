-- Ensure kanban_boards has space_id column with proper constraints
DO $$ 
BEGIN
  -- Add space_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kanban_boards' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE public.kanban_boards 
    ADD COLUMN space_id UUID REFERENCES public.kanban_spaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on space_id for better query performance
CREATE INDEX IF NOT EXISTS idx_kanban_boards_space_id 
ON public.kanban_boards(space_id);

-- Create index on user_id and space_id combination for filtering
CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_space 
ON public.kanban_boards(user_id, space_id);

-- Add comment to document the relationship
COMMENT ON COLUMN public.kanban_boards.space_id IS 
'Foreign key to kanban_spaces table. NULL means board is unorganized/not in any space.';