-- Indexes for company_documents table to optimize Document Grid

-- 1. Company filter - for opening a specific company's folder
CREATE INDEX IF NOT EXISTS idx_company_docs_company_id 
ON public.company_documents(company_id);

-- 2. Folder filter - for navigating folder hierarchy
CREATE INDEX IF NOT EXISTS idx_company_docs_folder_id 
ON public.company_documents(folder_id);

-- 3. Category filter - when filtering by "Invoices" or "Contracts"
CREATE INDEX IF NOT EXISTS idx_company_docs_document_type 
ON public.company_documents(document_type);

-- 4. Status filter - filtering by Draft/Final/Filed
CREATE INDEX IF NOT EXISTS idx_company_docs_status 
ON public.company_documents(status);

-- 5. Date sorting - sort newest to oldest
CREATE INDEX IF NOT EXISTS idx_company_docs_created_at 
ON public.company_documents(created_at DESC);

-- 6. Financial value sorting - "show me highest value documents first"
CREATE INDEX IF NOT EXISTS idx_company_docs_financial_value 
ON public.company_documents(financial_value DESC NULLS LAST);

-- 7. RLS security - verify who can see what
CREATE INDEX IF NOT EXISTS idx_company_docs_uploaded_by 
ON public.company_documents(uploaded_by);

-- 8. Composite index for common query pattern (company + folder + date)
CREATE INDEX IF NOT EXISTS idx_company_docs_company_folder_date 
ON public.company_documents(company_id, folder_id, created_at DESC);

-- 9. Composite index for filtering + sorting by value
CREATE INDEX IF NOT EXISTS idx_company_docs_company_type_value 
ON public.company_documents(company_id, document_type, financial_value DESC NULLS LAST);