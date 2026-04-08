-- Add account_type field to bank_accounts to support credit cards
ALTER TABLE public.bank_accounts 
ADD COLUMN account_type text NOT NULL DEFAULT 'bank_account';

-- Add comment explaining the field
COMMENT ON COLUMN public.bank_accounts.account_type IS 'Type of account: bank_account or credit_card';
