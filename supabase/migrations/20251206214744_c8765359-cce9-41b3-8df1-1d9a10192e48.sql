-- Add category_id column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN category_id uuid REFERENCES public.expense_categories(id);