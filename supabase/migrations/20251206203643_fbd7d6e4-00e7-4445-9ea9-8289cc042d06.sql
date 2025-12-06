-- Add associated_companies column to expense_projects table
ALTER TABLE public.expense_projects
ADD COLUMN associated_companies uuid[] DEFAULT ARRAY[]::uuid[];