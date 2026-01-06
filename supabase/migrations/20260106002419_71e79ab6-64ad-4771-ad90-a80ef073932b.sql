-- Drop and recreate the category constraint to include Marine
ALTER TABLE public.wealth_assets DROP CONSTRAINT wealth_assets_category_check;

ALTER TABLE public.wealth_assets ADD CONSTRAINT wealth_assets_category_check 
CHECK (category = ANY (ARRAY['Real Estate', 'Crypto', 'Fine Art', 'Watches', 'Vehicles', 'Private Equity', 'Cash', 'Marine', 'Art', 'Other']));