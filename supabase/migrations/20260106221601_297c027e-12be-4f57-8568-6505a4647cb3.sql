-- Add fundamental analysis fields to securities table
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS market_cap numeric,
ADD COLUMN IF NOT EXISTS eps numeric,
ADD COLUMN IF NOT EXISTS pe_ratio numeric,
ADD COLUMN IF NOT EXISTS pb_ratio numeric,
ADD COLUMN IF NOT EXISTS fcf numeric,
ADD COLUMN IF NOT EXISTS fcf_yield numeric,
ADD COLUMN IF NOT EXISTS roe numeric,
ADD COLUMN IF NOT EXISTS operating_margin numeric,
ADD COLUMN IF NOT EXISTS revenue_growth numeric,
ADD COLUMN IF NOT EXISTS debt_to_equity numeric,
ADD COLUMN IF NOT EXISTS interest_coverage numeric,
ADD COLUMN IF NOT EXISTS dividend_yield numeric,
ADD COLUMN IF NOT EXISTS payout_ratio numeric,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS industry text;

-- Add comments for documentation
COMMENT ON COLUMN public.securities.market_cap IS 'Market capitalization in base currency';
COMMENT ON COLUMN public.securities.eps IS 'Earnings per share (TTM)';
COMMENT ON COLUMN public.securities.pe_ratio IS 'Price-to-earnings ratio';
COMMENT ON COLUMN public.securities.pb_ratio IS 'Price-to-book ratio';
COMMENT ON COLUMN public.securities.fcf IS 'Free cash flow';
COMMENT ON COLUMN public.securities.fcf_yield IS 'FCF yield (FCF/Market Cap)';
COMMENT ON COLUMN public.securities.roe IS 'Return on equity (%)';
COMMENT ON COLUMN public.securities.operating_margin IS 'Operating margin (%)';
COMMENT ON COLUMN public.securities.revenue_growth IS 'Revenue growth 3-5y (%)';
COMMENT ON COLUMN public.securities.debt_to_equity IS 'Debt-to-equity ratio';
COMMENT ON COLUMN public.securities.interest_coverage IS 'Interest coverage (EBIT/Interest)';
COMMENT ON COLUMN public.securities.dividend_yield IS 'Dividend yield (%)';
COMMENT ON COLUMN public.securities.payout_ratio IS 'Dividend payout ratio (%)';