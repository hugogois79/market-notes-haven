-- Indexes for company_documents (most used table in workflow)
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON public.company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_folder_id ON public.company_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_created_at ON public.company_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_documents_updated_at ON public.company_documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_documents_status ON public.company_documents(status);
CREATE INDEX IF NOT EXISTS idx_company_documents_document_type ON public.company_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_company_documents_name ON public.company_documents(name);
CREATE INDEX IF NOT EXISTS idx_company_documents_file_size ON public.company_documents(file_size);

-- Composite index for common query pattern (company + folder + sorting)
CREATE INDEX IF NOT EXISTS idx_company_documents_company_folder_updated 
ON public.company_documents(company_id, folder_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_documents_company_folder_created 
ON public.company_documents(company_id, folder_id, created_at DESC);

-- Indexes for company_folders
CREATE INDEX IF NOT EXISTS idx_company_folders_company_id ON public.company_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_company_folders_parent_folder_id ON public.company_folders(parent_folder_id);

-- Indexes for financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_company_id ON public.financial_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_document_file_id ON public.financial_transactions(document_file_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id ON public.financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category_id ON public.financial_transactions(category_id);

-- Indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);

-- Indexes for company_users
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);

-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- Indexes for expense_projects
CREATE INDEX IF NOT EXISTS idx_expense_projects_is_active ON public.expense_projects(is_active);

-- Indexes for expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON public.expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_active ON public.expense_categories(is_active);