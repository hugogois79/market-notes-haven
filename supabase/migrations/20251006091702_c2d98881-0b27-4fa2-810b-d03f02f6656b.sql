-- Enable RLS on the expenses table which contains sensitive financial data
-- This is the remaining table without RLS protection

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view expenses from their projects" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses to their projects" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses in their projects" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses from their projects" ON public.expenses;

-- Allow users to view expenses from their own projects
CREATE POLICY "Users can view expenses from their projects"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    ) OR project_id IS NULL
  );

-- Allow users to insert expenses to their own projects
CREATE POLICY "Users can insert expenses to their projects"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    ) OR project_id IS NULL
  );

-- Allow users to update expenses in their own projects
CREATE POLICY "Users can update expenses in their projects"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    ) OR project_id IS NULL
  );

-- Allow users to delete expenses from their own projects
CREATE POLICY "Users can delete expenses from their projects"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    ) OR project_id IS NULL
  );