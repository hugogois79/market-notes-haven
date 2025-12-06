-- Add claim_date column to expense_claims table
ALTER TABLE public.expense_claims 
ADD COLUMN claim_date date NOT NULL DEFAULT CURRENT_DATE;