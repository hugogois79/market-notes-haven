-- Add document_file_id column to link financial transactions to workflow documents
ALTER TABLE public.financial_transactions
ADD COLUMN document_file_id text;

-- Add index for efficient lookups by document_file_id
CREATE INDEX idx_financial_transactions_document_file_id 
ON public.financial_transactions(document_file_id)
WHERE document_file_id IS NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.financial_transactions.document_file_id IS 'Links this payment transaction to a workflow document file ID';