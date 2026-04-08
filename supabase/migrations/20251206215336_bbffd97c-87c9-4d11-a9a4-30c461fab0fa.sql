-- Add assigned_project_ids column to expense_categories table
ALTER TABLE public.expense_categories 
ADD COLUMN assigned_project_ids uuid[] DEFAULT ARRAY[]::uuid[];