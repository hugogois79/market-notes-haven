-- Adicionar campo document_type (tipo de documento)
ALTER TABLE public.workflow_files
ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Adicionar campo supplier_id (referência ao fornecedor)
ALTER TABLE public.workflow_files
ADD COLUMN IF NOT EXISTS supplier_id TEXT;

-- Adicionar campo customer_vat (NIF do destinatário para associação automática de empresa)
ALTER TABLE public.workflow_files
ADD COLUMN IF NOT EXISTS customer_vat TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.workflow_files.document_type IS 'Tipo de documento extraído por OCR (ex: fatura, recibo, nota de crédito)';
COMMENT ON COLUMN public.workflow_files.supplier_id IS 'Identificador do fornecedor extraído por OCR';
COMMENT ON COLUMN public.workflow_files.customer_vat IS 'NIF do destinatário/cliente extraído por OCR para associação automática de empresa';