-- Add project_id column to wealth_transactions table
ALTER TABLE public.wealth_transactions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.expense_projects(id);