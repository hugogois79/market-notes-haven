-- Add comprehensive ETF-specific fields to securities table
ALTER TABLE securities
ADD COLUMN IF NOT EXISTS nav numeric,
ADD COLUMN IF NOT EXISTS nav_premium_discount numeric,
ADD COLUMN IF NOT EXISTS avg_daily_volume bigint,
ADD COLUMN IF NOT EXISTS bid_ask_spread numeric,
ADD COLUMN IF NOT EXISTS domicile text,
ADD COLUMN IF NOT EXISTS distribution_policy text,
ADD COLUMN IF NOT EXISTS top_10_holdings_weight numeric,
ADD COLUMN IF NOT EXISTS return_1y numeric,
ADD COLUMN IF NOT EXISTS return_3y numeric,
ADD COLUMN IF NOT EXISTS return_5y numeric,
ADD COLUMN IF NOT EXISTS volatility numeric,
ADD COLUMN IF NOT EXISTS tracking_error numeric,
ADD COLUMN IF NOT EXISTS exchange text;

-- Comments for documentation
COMMENT ON COLUMN securities.nav IS 'Net Asset Value per share';
COMMENT ON COLUMN securities.nav_premium_discount IS 'Premium/discount vs NAV (%)';
COMMENT ON COLUMN securities.avg_daily_volume IS 'Average daily trading volume';
COMMENT ON COLUMN securities.bid_ask_spread IS 'Bid-ask spread (%)';
COMMENT ON COLUMN securities.domicile IS 'ETF domicile (IE, LU, US, etc.)';
COMMENT ON COLUMN securities.distribution_policy IS 'accumulating or distributing';
COMMENT ON COLUMN securities.top_10_holdings_weight IS 'Weight of top 10 holdings (%)';
COMMENT ON COLUMN securities.return_1y IS '1-year return (%)';
COMMENT ON COLUMN securities.return_3y IS '3-year annualized return (%)';
COMMENT ON COLUMN securities.return_5y IS '5-year annualized return (%)';
COMMENT ON COLUMN securities.volatility IS 'Annualized volatility (%)';
COMMENT ON COLUMN securities.tracking_error IS 'Tracking error vs benchmark (%)';
COMMENT ON COLUMN securities.exchange IS 'Listing exchange (XETRA, LSE, NYSE)';