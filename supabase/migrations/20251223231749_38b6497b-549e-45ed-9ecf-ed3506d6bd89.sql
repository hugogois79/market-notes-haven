-- Create indexes on workflow_files for better query performance

-- Index for user_id (most queries filter by user)
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_id ON public.workflow_files(user_id);

-- Index for status (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_workflow_files_status ON public.workflow_files(status);

-- Index for category (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_workflow_files_category ON public.workflow_files(category);

-- Index for created_at (sorting by date)
CREATE INDEX IF NOT EXISTS idx_workflow_files_created_at ON public.workflow_files(created_at DESC);

-- Composite index for user_id + created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_created ON public.workflow_files(user_id, created_at DESC);

-- Composite index for user_id + status (filtering by status for a user)
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_status ON public.workflow_files(user_id, status);

-- Composite index for user_id + category (filtering by category for a user)
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_category ON public.workflow_files(user_id, category);

-- Index for file_name with trigram for text search (if pg_trgm is available)
CREATE INDEX IF NOT EXISTS idx_workflow_files_file_name_trgm ON public.workflow_files USING gin(file_name gin_trgm_ops);

-- Index for company_loans source_file_id (for joining with workflow files)
CREATE INDEX IF NOT EXISTS idx_company_loans_source_file_id ON public.company_loans(source_file_id);

-- Index for financial_transactions document_file_id (for joining with workflow files)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_document_file_id ON public.financial_transactions(document_file_id);

-- Index for loan_payments loan_id (for faster payment lookups)
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);

-- Index for loan_payments payment_date (for date-based queries)
CREATE INDEX IF NOT EXISTS idx_loan_payments_payment_date ON public.loan_payments(payment_date DESC);