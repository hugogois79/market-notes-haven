-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create their own companies" ON public.companies;

-- Create a new INSERT policy that allows authenticated users to create companies
CREATE POLICY "Users can create their own companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());