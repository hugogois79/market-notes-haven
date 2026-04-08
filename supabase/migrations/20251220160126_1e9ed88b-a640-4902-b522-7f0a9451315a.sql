-- Create indexes for workflow_files table (uses user_id, not company_id)
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_id ON public.workflow_files(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_files_status ON public.workflow_files(status);
CREATE INDEX IF NOT EXISTS idx_workflow_files_category ON public.workflow_files(category);
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_created ON public.workflow_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_status ON public.workflow_files(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_category ON public.workflow_files(user_id, category);
CREATE INDEX IF NOT EXISTS idx_workflow_files_file_name ON public.workflow_files USING gin(file_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workflow_files_updated_at ON public.workflow_files(updated_at DESC);

-- Create indexes for company_documents table
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON public.company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_folder_id ON public.company_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_status ON public.company_documents(status);
CREATE INDEX IF NOT EXISTS idx_company_documents_document_type ON public.company_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_company_documents_company_created ON public.company_documents(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_documents_company_folder ON public.company_documents(company_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_name ON public.company_documents USING gin(name gin_trgm_ops);

-- Create indexes for company_folders table
CREATE INDEX IF NOT EXISTS idx_company_folders_company_id ON public.company_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_company_folders_parent ON public.company_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_company_folders_company_parent ON public.company_folders(company_id, parent_folder_id);

-- Create indexes for workflow_storage_locations
CREATE INDEX IF NOT EXISTS idx_workflow_storage_company ON public.workflow_storage_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_storage_user ON public.workflow_storage_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_storage_folder ON public.workflow_storage_locations(folder_id);