
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage requesters" ON public.expense_requesters;
DROP POLICY IF EXISTS "Anyone can view active requesters" ON public.expense_requesters;
DROP POLICY IF EXISTS "Users can view active requesters" ON public.expense_requesters;

-- Create new policies for authenticated users to fully manage requesters
CREATE POLICY "Authenticated users can view all requesters" 
ON public.expense_requesters 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert requesters" 
ON public.expense_requesters 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update requesters" 
ON public.expense_requesters 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete requesters" 
ON public.expense_requesters 
FOR DELETE 
USING (auth.uid() IS NOT NULL);
