-- Remove public access policy from notes table
-- This policy was allowing anyone on the internet to read all private notes
DROP POLICY IF EXISTS "Public Access for Development" ON public.notes;

-- The existing user_id-based policies will ensure users can only access their own notes:
-- - "Users can view their own notes" (SELECT with user_id = auth.uid())
-- - "Users can create their own notes" (INSERT with user_id = auth.uid())
-- - "Users can update their own notes" (UPDATE with user_id = auth.uid())
-- - "Users can delete their own notes" (DELETE with user_id = auth.uid())