-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own expense claims" ON expense_claims;

-- Create a new SELECT policy that allows:
-- 1. Users to see their own claims (employee_id = auth.uid())
-- 2. Admins to see all claims
CREATE POLICY "Users can view expense claims" 
ON expense_claims FOR SELECT 
USING (
  auth.uid() = employee_id 
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);