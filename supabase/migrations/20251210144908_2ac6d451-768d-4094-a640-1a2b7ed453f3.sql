-- Drop the old foreign key constraint
ALTER TABLE public.financial_transactions
DROP CONSTRAINT IF EXISTS financial_transactions_project_id_fkey;

-- Add new foreign key to expense_projects (unified project system)
ALTER TABLE public.financial_transactions
ADD CONSTRAINT financial_transactions_project_id_fkey
FOREIGN KEY (project_id) REFERENCES public.expense_projects(id)
ON DELETE SET NULL;