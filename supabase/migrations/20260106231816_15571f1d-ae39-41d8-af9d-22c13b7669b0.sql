-- Add analyst price target fields to securities table
ALTER TABLE securities
ADD COLUMN IF NOT EXISTS analyst_target_price numeric,
ADD COLUMN IF NOT EXISTS analyst_target_high numeric,
ADD COLUMN IF NOT EXISTS analyst_target_low numeric,
ADD COLUMN IF NOT EXISTS analyst_count integer,
ADD COLUMN IF NOT EXISTS recent_analyses jsonb;

COMMENT ON COLUMN securities.analyst_target_price IS 'Consensus price target from analysts';
COMMENT ON COLUMN securities.analyst_target_high IS 'Highest analyst price target';
COMMENT ON COLUMN securities.analyst_target_low IS 'Lowest analyst price target';
COMMENT ON COLUMN securities.analyst_count IS 'Number of analysts covering';
COMMENT ON COLUMN securities.recent_analyses IS 'Last 3 individual analyst ratings as JSON array';