-- Fix the INSERT policy for companies table
DROP POLICY IF EXISTS "Users can create their own companies" ON companies;

CREATE POLICY "Users can create their own companies"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());