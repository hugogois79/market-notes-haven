-- Enable RLS on tables that are currently exposed without protection
-- This fixes the critical security vulnerability where tables are accessible without proper access control

-- 1. EXPENSES TABLE - Contains sensitive financial transaction data
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Allow users to view expenses from their own projects
CREATE POLICY "Users can view expenses from their projects"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert expenses to their own projects
CREATE POLICY "Users can insert expenses to their projects"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Allow users to update expenses in their own projects
CREATE POLICY "Users can update expenses in their projects"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete expenses from their own projects
CREATE POLICY "Users can delete expenses from their projects"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- 2. PAYMENT METHODS TABLE - Payment information
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view payment methods (shared resource)
CREATE POLICY "Authenticated users can view payment methods"
  ON public.payment_methods
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can create payment methods
CREATE POLICY "Authenticated users can create payment methods"
  ON public.payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update payment methods
CREATE POLICY "Authenticated users can update payment methods"
  ON public.payment_methods
  FOR UPDATE
  TO authenticated
  USING (true);

-- Only authenticated users can delete payment methods
CREATE POLICY "Authenticated users can delete payment methods"
  ON public.payment_methods
  FOR DELETE
  TO authenticated
  USING (true);

-- 3. FILES TABLE - Document storage metadata
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to access files (adjust based on your needs)
CREATE POLICY "Authenticated users can view files"
  ON public.files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create files"
  ON public.files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update files"
  ON public.files
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete files"
  ON public.files
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. DOCUMENTS AND DOCUMENTS_NEW TABLES - Document content
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

ALTER TABLE public.documents_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents_new"
  ON public.documents_new
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create documents_new"
  ON public.documents_new
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. OTHER SUPPORT TABLES
ALTER TABLE public.diana ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access diana"
  ON public.diana
  FOR ALL
  TO authenticated
  USING (true);

ALTER TABLE public.document_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access document_summaries"
  ON public.document_summaries
  FOR ALL
  TO authenticated
  USING (true);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view news articles"
  ON public.news_articles
  FOR SELECT
  USING (true);