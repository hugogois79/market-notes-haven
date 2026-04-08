-- Create monthly objectives table for strategy footer
CREATE TABLE public.monthly_objectives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  month integer, -- 1 to 12 (or null if annual)
  year integer NOT NULL,
  content text NOT NULL,
  is_completed boolean DEFAULT false,
  column_index integer DEFAULT 1, -- 1, 2, or 3 for the 3 columns
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.monthly_objectives ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own objectives"
ON public.monthly_objectives FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own objectives"
ON public.monthly_objectives FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objectives"
ON public.monthly_objectives FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own objectives"
ON public.monthly_objectives FOR DELETE
USING (auth.uid() = user_id);