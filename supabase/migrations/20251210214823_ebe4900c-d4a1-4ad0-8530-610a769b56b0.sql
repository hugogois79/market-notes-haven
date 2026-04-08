-- Update the SELECT policy to include notes with null user_id (legacy/shared notes)
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;

CREATE POLICY "Users can view their own notes" 
ON public.notes 
FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);