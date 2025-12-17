-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can manage their own storage locations" ON public.workflow_storage_locations;

-- Create a more permissive policy for authenticated users
CREATE POLICY "Authenticated users can manage storage locations" 
ON public.workflow_storage_locations 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);