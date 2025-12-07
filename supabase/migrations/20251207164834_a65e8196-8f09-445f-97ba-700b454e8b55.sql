-- Create project_monthly_budgets table for defining monthly costs per project
CREATE TABLE public.project_monthly_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.expense_projects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, year, month)
);

-- Enable RLS
ALTER TABLE public.project_monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view project budgets"
ON public.project_monthly_budgets
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage project budgets"
ON public.project_monthly_budgets
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_project_monthly_budgets_updated_at
BEFORE UPDATE ON public.project_monthly_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add monthly_budget column to expense_projects for default monthly budget
ALTER TABLE public.expense_projects 
ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC DEFAULT 0;