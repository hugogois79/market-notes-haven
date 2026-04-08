-- Drop the existing constraint
ALTER TABLE wealth_assets DROP CONSTRAINT IF EXISTS wealth_assets_category_check;

-- Add the new constraint including Properties
ALTER TABLE wealth_assets ADD CONSTRAINT wealth_assets_category_check 
CHECK (category IN ('Real Estate', 'Real Estate Fund', 'Properties', 'Vehicles', 'Marine', 'Art', 'Watches', 'Crypto', 'Private Equity', 'Cash', 'Other'));