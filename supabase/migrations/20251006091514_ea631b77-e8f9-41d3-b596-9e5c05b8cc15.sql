-- Enable RLS on tables that currently have no protection
-- Only enabling RLS on tables that don't have it yet

-- Check and enable RLS only if not already enabled
DO $$ 
BEGIN
  -- DIANA TABLE - AI/ML vector storage
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'diana' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.diana ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can access diana"
      ON public.diana
      FOR ALL
      TO authenticated
      USING (true);
  END IF;

  -- DOCUMENT_SUMMARIES TABLE
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'document_summaries' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.document_summaries ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can access document_summaries"
      ON public.document_summaries
      FOR ALL
      TO authenticated
      USING (true);
  END IF;

  -- DOCUMENTS TABLE
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'documents' 
    AND rowsecurity = true
  ) THEN
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
  END IF;

  -- DOCUMENTS_NEW TABLE
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'documents_new' 
    AND rowsecurity = true
  ) THEN
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
  END IF;

  -- FILES TABLE
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'files' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
    
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
  END IF;

  -- NEWS_ARTICLES TABLE - Public content
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'news_articles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "All users can view news articles"
      ON public.news_articles
      FOR SELECT
      USING (true);
  END IF;

  -- PAYMENT_METHODS TABLE
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'payment_methods' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view payment methods"
      ON public.payment_methods
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Authenticated users can create payment methods"
      ON public.payment_methods
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Authenticated users can update payment methods"
      ON public.payment_methods
      FOR UPDATE
      TO authenticated
      USING (true);

    CREATE POLICY "Authenticated users can delete payment methods"
      ON public.payment_methods
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;