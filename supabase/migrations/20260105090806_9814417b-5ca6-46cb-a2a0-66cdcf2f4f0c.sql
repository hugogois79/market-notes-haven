-- =====================================================
-- FIX PUBLIC_DATA_EXPOSURE: Secure 6 tables with proper RLS
-- =====================================================

-- 1. FIX NOTES TABLE: Remove NULL user_id access
-- Current policy allows: (user_id IS NULL) OR (auth.uid() = user_id)
-- This exposes notes with NULL user_id to everyone

DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- Create secure policies that require authentication
CREATE POLICY "Users can view their own notes" 
ON public.notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes 
FOR DELETE 
USING (auth.uid() = user_id);


-- 2. FIX FOLDER_INSIGHTS TABLE: Currently has USING condition: true
-- Restrict to authenticated users who can access the parent folder's company

DROP POLICY IF EXISTS "Anyone can view folder insights" ON public.folder_insights;
DROP POLICY IF EXISTS "Anyone can insert folder insights" ON public.folder_insights;
DROP POLICY IF EXISTS "Anyone can update folder insights" ON public.folder_insights;
DROP POLICY IF EXISTS "Anyone can delete folder insights" ON public.folder_insights;

-- Create secure policies that require access to the folder's company
CREATE POLICY "Users can view folder insights" 
ON public.folder_insights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.company_folders cf
    WHERE cf.id = folder_insights.folder_id
    AND public.user_can_access_company(auth.uid(), cf.company_id)
  )
);

CREATE POLICY "Users can insert folder insights" 
ON public.folder_insights 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_folders cf
    WHERE cf.id = folder_insights.folder_id
    AND public.user_can_access_company(auth.uid(), cf.company_id)
  )
);

CREATE POLICY "Users can update folder insights" 
ON public.folder_insights 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.company_folders cf
    WHERE cf.id = folder_insights.folder_id
    AND public.user_can_access_company(auth.uid(), cf.company_id)
  )
);

CREATE POLICY "Users can delete folder insights" 
ON public.folder_insights 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.company_folders cf
    WHERE cf.id = folder_insights.folder_id
    AND public.user_can_access_company(auth.uid(), cf.company_id)
  )
);


-- 3. FIX EXPENSE_PROJECTS TABLE: SELECT policy has USING condition: true (public read)

DROP POLICY IF EXISTS "Authenticated users can view expense projects" ON public.expense_projects;

-- Create policy that requires authentication
CREATE POLICY "Authenticated users can view expense projects" 
ON public.expense_projects 
FOR SELECT 
USING (auth.uid() IS NOT NULL);


-- 4. FIX TOKENS TABLE: Currently has USING condition: true for SELECT

DROP POLICY IF EXISTS "Users can view all tokens" ON public.tokens;

-- Create policy that requires authentication
CREATE POLICY "Authenticated users can view tokens" 
ON public.tokens 
FOR SELECT 
USING (auth.uid() IS NOT NULL);


-- 5. FIX SUPPLIERS TABLE: Currently has "Anyone can view active suppliers" with public access

DROP POLICY IF EXISTS "Anyone can view active suppliers" ON public.suppliers;

-- Create policy that requires authentication
CREATE POLICY "Authenticated users can view active suppliers" 
ON public.suppliers 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);


-- 6. FIX NOTES_TOKENS TABLE: Currently has USING condition: true for SELECT

DROP POLICY IF EXISTS "Users can view all notes_tokens" ON public.notes_tokens;

-- Create policy that requires ownership of related note
CREATE POLICY "Users can view their own notes_tokens" 
ON public.notes_tokens 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.id = notes_tokens.note_id
    AND n.user_id = auth.uid()
  )
);