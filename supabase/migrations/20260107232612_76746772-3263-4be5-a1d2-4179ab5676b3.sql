-- Drop existing constraint and add new one with Airplanes
ALTER TABLE wealth_assets DROP CONSTRAINT IF EXISTS wealth_assets_category_check;

ALTER TABLE wealth_assets ADD CONSTRAINT wealth_assets_category_check 
CHECK (category IN ('Real Estate Fund', 'Properties', 'Vehicles', 'Marine', 'Art', 'Watches', 'Crypto', 'Private Equity', 'Cash', 'Other', 'Airplanes'));