-- Drop existing constraint and add new one with transferencia_bancaria
ALTER TABLE public.expense_claims 
DROP CONSTRAINT expense_claims_claim_type_check;

ALTER TABLE public.expense_claims 
ADD CONSTRAINT expense_claims_claim_type_check 
CHECK (claim_type = ANY (ARRAY['reembolso'::text, 'justificacao_cartao'::text, 'transferencia_bancaria'::text]));