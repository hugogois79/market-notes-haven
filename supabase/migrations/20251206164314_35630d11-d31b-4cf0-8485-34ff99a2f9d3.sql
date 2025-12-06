-- Add project_id column to notes table for linking notes to expense projects
ALTER TABLE public.notes 
ADD COLUMN project_id uuid REFERENCES public.expense_projects(id) ON DELETE SET NULL;