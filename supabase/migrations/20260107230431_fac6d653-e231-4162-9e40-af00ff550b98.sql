-- Add appreciation/depreciation fields to wealth_assets
ALTER TABLE public.wealth_assets 
ADD COLUMN IF NOT EXISTS appreciation_type text DEFAULT 'appreciates',
ADD COLUMN IF NOT EXISTS annual_rate_percent numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS consider_appreciation boolean DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.wealth_assets.appreciation_type IS 'Type of value change: appreciates or depreciates';
COMMENT ON COLUMN public.wealth_assets.annual_rate_percent IS 'Annual appreciation/depreciation rate in percent';
COMMENT ON COLUMN public.wealth_assets.consider_appreciation IS 'Whether to include appreciation in CAGR and forecast calculations';