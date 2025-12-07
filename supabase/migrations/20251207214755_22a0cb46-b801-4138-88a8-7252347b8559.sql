-- Add category_id to project_monthly_revenues
ALTER TABLE project_monthly_revenues ADD COLUMN category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL;

-- Drop the old unique constraint and create new one with category_id
ALTER TABLE project_monthly_revenues DROP CONSTRAINT project_monthly_revenues_project_id_month_year_key;
ALTER TABLE project_monthly_revenues ADD CONSTRAINT project_monthly_revenues_project_category_month_year_key UNIQUE(project_id, category_id, month, year);