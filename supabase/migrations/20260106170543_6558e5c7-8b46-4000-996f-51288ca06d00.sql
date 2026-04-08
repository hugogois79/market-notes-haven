-- Add currency column to market_holdings
ALTER TABLE market_holdings ADD COLUMN currency TEXT DEFAULT 'EUR';