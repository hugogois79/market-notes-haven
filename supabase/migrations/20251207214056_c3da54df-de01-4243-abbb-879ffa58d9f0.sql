-- Add has_revenue column to expense_projects to identify projects that can have revenue
ALTER TABLE expense_projects ADD COLUMN has_revenue boolean DEFAULT false;

-- Create table for revenue budgets (similar to project_monthly_budgets but for revenue)
CREATE TABLE IF NOT EXISTS project_monthly_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES expense_projects(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  budgeted_amount numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, month, year)
);

-- Enable RLS
ALTER TABLE project_monthly_revenues ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view revenue budgets"
ON project_monthly_revenues FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage revenue budgets"
ON project_monthly_revenues FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);