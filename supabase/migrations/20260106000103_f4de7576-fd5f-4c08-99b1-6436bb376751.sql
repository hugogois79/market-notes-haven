-- Create subcategories table for wealth assets
CREATE TABLE public.wealth_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, category, user_id)
);

-- Enable RLS
ALTER TABLE public.wealth_subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subcategories" 
ON wealth_subcategories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subcategories" 
ON wealth_subcategories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subcategories" 
ON wealth_subcategories FOR DELETE 
USING (auth.uid() = user_id);