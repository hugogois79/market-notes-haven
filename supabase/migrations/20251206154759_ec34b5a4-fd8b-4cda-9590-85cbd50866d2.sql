-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage expense projects" ON public.expense_projects;

-- Create new policies for authenticated users to manage projects
CREATE POLICY "Authenticated users can manage expense projects" 
ON public.expense_projects 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);