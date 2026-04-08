-- Performance indexes for WorkFlow and related tables

-- workflow_files: main table for workflow
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_id ON public.workflow_files(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_created ON public.workflow_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_files_status ON public.workflow_files(status);
CREATE INDEX IF NOT EXISTS idx_workflow_files_company_id ON public.workflow_files(company_id);

-- financial_transactions: for linking files to transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_document_file_id ON public.financial_transactions(document_file_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_invoice_file_url ON public.financial_transactions(invoice_file_url);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_company_project ON public.financial_transactions(company_id, project_id);

-- company_folders: for folder lookups
CREATE INDEX IF NOT EXISTS idx_company_folders_company_id ON public.company_folders(company_id);

-- expense_projects: for active projects filter
CREATE INDEX IF NOT EXISTS idx_expense_projects_is_active ON public.expense_projects(is_active) WHERE is_active = true;

-- expense_categories: for active categories filter
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_active ON public.expense_categories(is_active) WHERE is_active = true;

-- bank_accounts: for active accounts filter
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON public.bank_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company_id ON public.bank_accounts(company_id);

-- workflow_storage_locations: for company lookup
CREATE INDEX IF NOT EXISTS idx_workflow_storage_locations_company_id ON public.workflow_storage_locations(company_id);

-- workflow_column_config: for user config lookup
CREATE INDEX IF NOT EXISTS idx_workflow_column_config_user_id ON public.workflow_column_config(user_id);

-- user_saved_filters: for user filters lookup
CREATE INDEX IF NOT EXISTS idx_user_saved_filters_user_type ON public.user_saved_filters(user_id, filter_type);

-- company_loans: for source file linking
CREATE INDEX IF NOT EXISTS idx_company_loans_source_file_id ON public.company_loans(source_file_id);

-- company_documents: for file URL and company lookups
CREATE INDEX IF NOT EXISTS idx_company_documents_file_url ON public.company_documents(file_url);
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON public.company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_folder_id ON public.company_documents(folder_id);