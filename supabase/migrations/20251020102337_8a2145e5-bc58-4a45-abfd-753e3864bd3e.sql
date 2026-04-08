-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can view company_users from their companies" ON company_users;

-- Create security definer function to check if user can access a company
CREATE OR REPLACE FUNCTION public.user_can_access_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM companies
    WHERE id = _company_id
    AND (
      owner_id = _user_id
      OR EXISTS (
        SELECT 1
        FROM company_users
        WHERE company_id = _company_id
        AND user_id = _user_id
      )
    )
  )
$$;

-- Recreate companies SELECT policy using the security definer function
CREATE POLICY "Users can view their own companies"
ON companies
FOR SELECT
USING (public.user_can_access_company(auth.uid(), id));

-- Recreate company_users SELECT policy
CREATE POLICY "Users can view company_users from their companies"
ON company_users
FOR SELECT
USING (
  user_id = auth.uid()
  OR company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
  )
);