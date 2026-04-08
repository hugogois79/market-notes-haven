-- Add OCR-extracted data fields to workflow_files table
ALTER TABLE workflow_files
ADD COLUMN IF NOT EXISTS invoice_date date,
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS vendor_name text,
ADD COLUMN IF NOT EXISTS vendor_vat text,
ADD COLUMN IF NOT EXISTS total_amount numeric,
ADD COLUMN IF NOT EXISTS tax_amount numeric,
ADD COLUMN IF NOT EXISTS subtotal numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS line_items_summary text;

COMMENT ON COLUMN workflow_files.invoice_date IS 'Data do documento extraída por OCR';
COMMENT ON COLUMN workflow_files.invoice_number IS 'Número da fatura extraído por OCR';
COMMENT ON COLUMN workflow_files.vendor_name IS 'Nome do fornecedor extraído por OCR';
COMMENT ON COLUMN workflow_files.vendor_vat IS 'NIF do fornecedor extraído por OCR';
COMMENT ON COLUMN workflow_files.total_amount IS 'Valor total com IVA extraído por OCR';
COMMENT ON COLUMN workflow_files.tax_amount IS 'Valor do IVA extraído por OCR';
COMMENT ON COLUMN workflow_files.subtotal IS 'Valor sem IVA extraído por OCR';
COMMENT ON COLUMN workflow_files.currency IS 'Moeda do documento';
COMMENT ON COLUMN workflow_files.payment_method IS 'Método de pagamento extraído por OCR';
COMMENT ON COLUMN workflow_files.line_items_summary IS 'Resumo das linhas do documento';