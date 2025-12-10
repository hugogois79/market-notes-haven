-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own expense_user record" ON expense_users;

-- Create a permissive SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view all expense_users"
ON expense_users
FOR SELECT
USING (auth.uid() IS NOT NULL);