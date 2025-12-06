-- Create expense_projects table for project assignments
CREATE TABLE public.expense_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3878B5',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_projects ENABLE ROW LEVEL SECURITY;

-- Create policies - viewable by all authenticated users
CREATE POLICY "Authenticated users can view expense projects"
  ON public.expense_projects
  FOR SELECT
  USING (true);

-- Only admins can manage projects
CREATE POLICY "Admins can manage expense projects"
  ON public.expense_projects
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_expense_projects_updated_at
  BEFORE UPDATE ON public.expense_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the existing projects
INSERT INTO public.expense_projects (name, color) VALUES
  ('RealEstate', '#10b981'),
  ('Representacao', '#6366f1'),
  ('Aviation', '#f59e0b'),
  ('DABMAR', '#ef4444'),
  ('Legal', '#8b5cf6'),
  ('Trading', '#06b6d4'),
  ('Trinidad', '#ec4899');