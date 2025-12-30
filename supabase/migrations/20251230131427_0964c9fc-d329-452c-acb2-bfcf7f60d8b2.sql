-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own categories" ON calendar_categories;

-- Create new SELECT policy that includes shared categories
CREATE POLICY "Users can view own and shared categories" 
ON calendar_categories 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() = ANY(shared_with_users)
);