-- Add has_investment flag to expense_projects table
ALTER TABLE public.expense_projects 
ADD COLUMN IF NOT EXISTS has_investment boolean DEFAULT false;