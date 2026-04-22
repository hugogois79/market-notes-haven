-- Performance: índices adicionais para Work (workflow_files), Document Library
-- (company_documents, company_folders) e estatísticas actualizadas.
-- Aplicar com: supabase db push / migração no dashboard SQL Editor.

-- Extensão para pesquisas ILIKE / similaridade em nomes (pode já existir)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- workflow_files: listagens filtradas por empresa ordenadas por data (além de user_id)
CREATE INDEX IF NOT EXISTS idx_workflow_files_company_created_at
  ON public.workflow_files (company_id, created_at DESC NULLS LAST);

-- company_folders: diálogo "mover" / ordenação por nome dentro da empresa
CREATE INDEX IF NOT EXISTS idx_company_folders_company_id_name
  ON public.company_folders (company_id, name);

-- company_documents: sync NVMe / lookups por caminho no servidor (parcial para poupar espaço)
CREATE INDEX IF NOT EXISTS idx_company_documents_server_path_not_empty
  ON public.company_documents (server_path)
  WHERE server_path IS NOT NULL AND btrim(server_path) <> '';

-- Junções frequentes: documento + tipo + ordenação por actualização
CREATE INDEX IF NOT EXISTS idx_company_documents_company_type_updated_at
  ON public.company_documents (company_id, document_type, updated_at DESC NULLS LAST);

-- Actualizar estatísticas do planner após migrações grandes (seguro em produção)
ANALYZE public.company_documents;
ANALYZE public.company_folders;
ANALYZE public.workflow_files;
ANALYZE public.financial_transactions;
ANALYZE public.companies;
