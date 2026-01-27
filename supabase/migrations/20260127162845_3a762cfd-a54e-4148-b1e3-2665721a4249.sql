-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view expenses from their claims" ON public.expenses;

-- Create a new policy that allows viewing expenses if:
-- 1. The user owns the expense claim (is the employee_id), OR
-- 2. The user is in the expense_users table (admin access)
CREATE POLICY "Users can view expenses from their claims or as admin" 
ON public.expenses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM expense_claims 
    WHERE expense_claims.id = expenses.expense_claim_id 
    AND expense_claims.employee_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM expense_users 
    WHERE expense_users.user_id = auth.uid() 
    AND expense_users.is_active = true
  )
);