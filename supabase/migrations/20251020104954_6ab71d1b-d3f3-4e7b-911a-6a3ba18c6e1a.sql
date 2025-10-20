-- Add country column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Portugal';

-- Recreate the INSERT policy to ensure it works correctly
DROP POLICY IF EXISTS "Users can create their own companies" ON public.companies;

CREATE POLICY "Users can create their own companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);