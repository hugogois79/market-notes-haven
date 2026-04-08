-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can view company_users from their companies" ON company_users;

-- Recreate companies SELECT policy without recursion
CREATE POLICY "Users can view their own companies"
ON companies
FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM company_users
    WHERE company_users.company_id = companies.id
    AND company_users.user_id = auth.uid()
  )
);

-- Recreate company_users SELECT policy without recursion
CREATE POLICY "Users can view company_users from their companies"
ON company_users
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_users.company_id
    AND companies.owner_id = auth.uid()
  )
);