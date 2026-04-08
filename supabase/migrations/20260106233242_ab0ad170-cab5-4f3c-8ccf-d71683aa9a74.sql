-- Add current_price and price_updated_at to securities table
ALTER TABLE securities
ADD COLUMN IF NOT EXISTS current_price numeric,
ADD COLUMN IF NOT EXISTS price_updated_at timestamptz;

COMMENT ON COLUMN securities.current_price IS 'Current market price fetched from FMP';
COMMENT ON COLUMN securities.price_updated_at IS 'When the price was last updated';