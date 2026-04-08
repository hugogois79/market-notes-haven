-- Add security type to securities table
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS security_type text DEFAULT 'equity';

-- Add type-specific fields for different security types
-- For Bonds
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS coupon_rate numeric,
ADD COLUMN IF NOT EXISTS maturity_date date,
ADD COLUMN IF NOT EXISTS credit_rating text,
ADD COLUMN IF NOT EXISTS yield_to_maturity numeric;

-- For ETFs
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS expense_ratio numeric,
ADD COLUMN IF NOT EXISTS aum numeric,
ADD COLUMN IF NOT EXISTS tracking_index text;

-- For Crypto
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS circulating_supply numeric,
ADD COLUMN IF NOT EXISTS max_supply numeric,
ADD COLUMN IF NOT EXISTS blockchain text;

-- For Commodities
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS commodity_type text,
ADD COLUMN IF NOT EXISTS contract_size numeric,
ADD COLUMN IF NOT EXISTS delivery_month text;

-- Update stock_prices table with additional fields for n8n
ALTER TABLE public.stock_prices
ADD COLUMN IF NOT EXISTS open_price numeric(12,4),
ADD COLUMN IF NOT EXISTS high_price numeric(12,4),
ADD COLUMN IF NOT EXISTS low_price numeric(12,4),
ADD COLUMN IF NOT EXISTS volume bigint,
ADD COLUMN IF NOT EXISTS market_cap bigint,
ADD COLUMN IF NOT EXISTS pe_ratio numeric(10,4),
ADD COLUMN IF NOT EXISTS year_high numeric(12,4),
ADD COLUMN IF NOT EXISTS year_low numeric(12,4);

-- Add comments
COMMENT ON COLUMN public.securities.security_type IS 'Type: equity, etf, bond, commodity, currency, crypto';
COMMENT ON COLUMN public.securities.coupon_rate IS 'Bond coupon rate (%)';
COMMENT ON COLUMN public.securities.maturity_date IS 'Bond maturity date';
COMMENT ON COLUMN public.securities.credit_rating IS 'Bond credit rating (AAA, AA, etc.)';
COMMENT ON COLUMN public.securities.yield_to_maturity IS 'Bond YTM (%)';
COMMENT ON COLUMN public.securities.expense_ratio IS 'ETF expense ratio (%)';
COMMENT ON COLUMN public.securities.aum IS 'ETF assets under management';
COMMENT ON COLUMN public.securities.tracking_index IS 'ETF tracking index name';
COMMENT ON COLUMN public.securities.circulating_supply IS 'Crypto circulating supply';
COMMENT ON COLUMN public.securities.max_supply IS 'Crypto max supply';
COMMENT ON COLUMN public.securities.blockchain IS 'Crypto blockchain network';