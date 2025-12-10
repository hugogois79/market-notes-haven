-- Add category_id column to financial_transactions to link with expense_categories
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.expense_categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category_id ON public.financial_transactions(category_id);