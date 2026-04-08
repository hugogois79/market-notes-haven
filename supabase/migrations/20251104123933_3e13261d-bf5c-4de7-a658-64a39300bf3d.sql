-- Create kanban_spaces table
CREATE TABLE IF NOT EXISTS public.kanban_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#0a4a6b',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add space_id to kanban_boards
ALTER TABLE public.kanban_boards 
ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.kanban_spaces(id) ON DELETE SET NULL;

-- Enable RLS on kanban_spaces
ALTER TABLE public.kanban_spaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kanban_spaces
CREATE POLICY "Users can view their own spaces"
  ON public.kanban_spaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spaces"
  ON public.kanban_spaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces"
  ON public.kanban_spaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
  ON public.kanban_spaces FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kanban_boards_space_id ON public.kanban_boards(space_id);
CREATE INDEX IF NOT EXISTS idx_kanban_spaces_user_id ON public.kanban_spaces(user_id);

-- Add updated_at trigger for kanban_spaces
CREATE TRIGGER update_kanban_spaces_updated_at
  BEFORE UPDATE ON public.kanban_spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();