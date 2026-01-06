-- FX/Currency specific fields
ALTER TABLE securities
ADD COLUMN IF NOT EXISTS base_currency text,
ADD COLUMN IF NOT EXISTS quote_currency text,
ADD COLUMN IF NOT EXISTS spot_rate numeric,
ADD COLUMN IF NOT EXISTS base_interest_rate numeric,
ADD COLUMN IF NOT EXISTS quote_interest_rate numeric,
ADD COLUMN IF NOT EXISTS forward_rate_3m numeric,
ADD COLUMN IF NOT EXISTS forward_rate_12m numeric,
ADD COLUMN IF NOT EXISTS fx_volatility_30d numeric,
ADD COLUMN IF NOT EXISTS fx_atr numeric,
ADD COLUMN IF NOT EXISTS support_level numeric,
ADD COLUMN IF NOT EXISTS resistance_level numeric,
ADD COLUMN IF NOT EXISTS base_inflation_rate numeric,
ADD COLUMN IF NOT EXISTS quote_inflation_rate numeric,
ADD COLUMN IF NOT EXISTS base_current_account numeric,
ADD COLUMN IF NOT EXISTS quote_current_account numeric,
ADD COLUMN IF NOT EXISTS base_credit_rating text,
ADD COLUMN IF NOT EXISTS quote_credit_rating text;

-- Comments para documentação
COMMENT ON COLUMN securities.base_currency IS 'Base currency of FX pair (e.g., EUR in EUR/USD)';
COMMENT ON COLUMN securities.quote_currency IS 'Quote currency of FX pair (e.g., USD in EUR/USD)';
COMMENT ON COLUMN securities.spot_rate IS 'Current spot exchange rate';
COMMENT ON COLUMN securities.base_interest_rate IS 'Central bank rate for base currency (%)';
COMMENT ON COLUMN securities.quote_interest_rate IS 'Central bank rate for quote currency (%)';
COMMENT ON COLUMN securities.forward_rate_3m IS '3-month forward rate';
COMMENT ON COLUMN securities.forward_rate_12m IS '12-month forward rate';
COMMENT ON COLUMN securities.fx_volatility_30d IS '30-day historical volatility (%)';
COMMENT ON COLUMN securities.fx_atr IS 'Average True Range';
COMMENT ON COLUMN securities.support_level IS 'Key technical support level';
COMMENT ON COLUMN securities.resistance_level IS 'Key technical resistance level';
COMMENT ON COLUMN securities.base_inflation_rate IS 'Annual inflation rate for base currency (%)';
COMMENT ON COLUMN securities.quote_inflation_rate IS 'Annual inflation rate for quote currency (%)';
COMMENT ON COLUMN securities.base_current_account IS 'Current account balance for base currency (% GDP)';
COMMENT ON COLUMN securities.quote_current_account IS 'Current account balance for quote currency (% GDP)';
COMMENT ON COLUMN securities.base_credit_rating IS 'Sovereign credit rating for base currency';
COMMENT ON COLUMN securities.quote_credit_rating IS 'Sovereign credit rating for quote currency';