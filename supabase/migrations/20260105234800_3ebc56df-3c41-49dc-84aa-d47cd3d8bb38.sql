-- Add specific columns found in the spreadsheet analysis to wealth_assets
ALTER TABLE wealth_assets 
ADD COLUMN IF NOT EXISTS profit_loss_value numeric,
ADD COLUMN IF NOT EXISTS yield_expected numeric,
ADD COLUMN IF NOT EXISTS target_value_6m numeric,
ADD COLUMN IF NOT EXISTS target_weight numeric,
ADD COLUMN IF NOT EXISTS vintage_year integer,
ADD COLUMN IF NOT EXISTS allocation_weight numeric,
ADD COLUMN IF NOT EXISTS recovery_value numeric,
ADD COLUMN IF NOT EXISTS previous_valuation numeric;

-- Add specific columns to wealth_transactions for the ledger
ALTER TABLE wealth_transactions 
ADD COLUMN IF NOT EXISTS counterparty text,
ADD COLUMN IF NOT EXISTS running_balance numeric,
ADD COLUMN IF NOT EXISTS category_weight numeric;