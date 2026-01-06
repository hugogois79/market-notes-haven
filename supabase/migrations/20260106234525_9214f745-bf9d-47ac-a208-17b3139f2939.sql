-- Add new analyst history fields to securities table
ALTER TABLE securities
ADD COLUMN IF NOT EXISTS analyst_last_month_count integer,
ADD COLUMN IF NOT EXISTS analyst_last_month_avg numeric,
ADD COLUMN IF NOT EXISTS analyst_last_quarter_count integer,
ADD COLUMN IF NOT EXISTS analyst_last_quarter_avg numeric,
ADD COLUMN IF NOT EXISTS analyst_publishers text[];