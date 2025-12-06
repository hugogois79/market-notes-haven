-- Add new columns to expense_projects table
ALTER TABLE public.expense_projects 
ADD COLUMN start_date date,
ADD COLUMN end_date date,
ADD COLUMN total_cost numeric DEFAULT 0;