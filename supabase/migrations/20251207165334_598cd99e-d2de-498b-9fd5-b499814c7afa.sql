-- Add category_id to project_monthly_budgets for category-level budgeting
ALTER TABLE public.project_monthly_budgets 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE;

-- Drop the existing unique constraint
ALTER TABLE public.project_monthly_budgets 
DROP CONSTRAINT IF EXISTS project_monthly_budgets_project_id_year_month_key;

-- Create new unique constraint including category_id
ALTER TABLE public.project_monthly_budgets 
ADD CONSTRAINT project_monthly_budgets_unique_budget UNIQUE(project_id, year, month, category_id);