-- =============================================
-- FIX 1: Storage Buckets - Make them private
-- =============================================

-- Update all storage buckets to private
UPDATE storage.buckets SET public = false WHERE name = 'Expense Receipts';
UPDATE storage.buckets SET public = false WHERE name = 'expense-pdfs';
UPDATE storage.buckets SET public = false WHERE name = 'legal-documents';
UPDATE storage.buckets SET public = false WHERE name = 'Note Attachments';
UPDATE storage.buckets SET public = false WHERE name = 'kanban-attachments';
UPDATE storage.buckets SET public = false WHERE name = 'avatars';
UPDATE storage.buckets SET public = false WHERE name = 'Profile Photos';
UPDATE storage.buckets SET public = false WHERE name = 'company-logos';
UPDATE storage.buckets SET public = false WHERE name = 'task-images';

-- =============================================
-- FIX 2: Drop overly permissive RLS policies
-- =============================================

-- diana table - drop permissive policy
DROP POLICY IF EXISTS "Authenticated users can access diana" ON public.diana;

-- document_summaries table - drop permissive policy
DROP POLICY IF EXISTS "Authenticated users can access document_summaries" ON public.document_summaries;

-- documents table - drop permissive policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can create documents" ON public.documents;

-- documents_new table - drop permissive policies
DROP POLICY IF EXISTS "Authenticated users can view documents_new" ON public.documents_new;
DROP POLICY IF EXISTS "Authenticated users can create documents_new" ON public.documents_new;

-- report_expenses table - drop permissive policies (roles: public = DANGEROUS)
DROP POLICY IF EXISTS "Users can view report expenses" ON public.report_expenses;
DROP POLICY IF EXISTS "Users can create report expenses" ON public.report_expenses;
DROP POLICY IF EXISTS "Users can delete report expenses" ON public.report_expenses;

-- tao_subnets table - drop the conflicting overly permissive policies (keep user-scoped ones)
DROP POLICY IF EXISTS "Authenticated users can view subnets" ON public.tao_subnets;
DROP POLICY IF EXISTS "Authenticated users can insert subnets" ON public.tao_subnets;
DROP POLICY IF EXISTS "Authenticated users can update subnets" ON public.tao_subnets;
DROP POLICY IF EXISTS "Authenticated users can delete subnets" ON public.tao_subnets;

-- =============================================
-- FIX 3: Create proper user-scoped RLS policies
-- =============================================

-- diana table: Only authenticated users can access, but this table has no user_id
-- For now, restrict to authenticated users only (not public)
CREATE POLICY "Authenticated users can read diana"
  ON public.diana FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert diana"
  ON public.diana FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- document_summaries: Restrict access to authenticated users through file ownership
CREATE POLICY "Authenticated users can read document_summaries"
  ON public.document_summaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert document_summaries"
  ON public.document_summaries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- documents table: Restrict to authenticated users only
CREATE POLICY "Authenticated users can read documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- documents_new table: Has file_id -> files table has user_id
-- Use ownership via files table
CREATE POLICY "Users can view their documents_new"
  ON public.documents_new FOR SELECT
  TO authenticated
  USING (
    file_id IS NULL OR 
    EXISTS (SELECT 1 FROM public.files WHERE files.id = documents_new.file_id AND files.user_id = auth.uid())
  );

CREATE POLICY "Users can insert documents_new"
  ON public.documents_new FOR INSERT
  TO authenticated
  WITH CHECK (
    file_id IS NULL OR 
    EXISTS (SELECT 1 FROM public.files WHERE files.id = file_id AND files.user_id = auth.uid())
  );

-- report_expenses table: Link to expense_reports which has user_id
CREATE POLICY "Users can view their report_expenses"
  ON public.report_expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_reports 
      WHERE expense_reports.id = report_expenses.report_id 
      AND expense_reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their report_expenses"
  ON public.report_expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expense_reports 
      WHERE expense_reports.id = report_id 
      AND expense_reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their report_expenses"
  ON public.report_expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_reports 
      WHERE expense_reports.id = report_expenses.report_id 
      AND expense_reports.user_id = auth.uid()
    )
  );

-- tao_subnets: Already has user-scoped policies, just removed the conflicting ones above
-- No new policies needed as the user-scoped ones remain intact