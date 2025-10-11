-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;

-- Create a more permissive policy to allow viewing all tags
CREATE POLICY "Users can view all tags"
ON public.tags
FOR SELECT
TO authenticated
USING (true);