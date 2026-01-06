-- Create wealth_milestones table
CREATE TABLE public.wealth_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  target_date DATE,
  category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'cancelled')),
  achieved_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wealth_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own milestones"
ON public.wealth_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own milestones"
ON public.wealth_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
ON public.wealth_milestones FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones"
ON public.wealth_milestones FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_wealth_milestones_updated_at
BEFORE UPDATE ON public.wealth_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();