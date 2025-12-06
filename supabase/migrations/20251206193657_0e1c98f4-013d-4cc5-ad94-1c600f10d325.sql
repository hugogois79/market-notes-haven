-- First drop the existing foreign key constraint
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS fk_expenses_project;