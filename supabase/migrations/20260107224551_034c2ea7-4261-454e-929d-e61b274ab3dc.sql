-- Drop existing constraint first
ALTER TABLE wealth_assets DROP CONSTRAINT IF EXISTS wealth_assets_category_check;

-- Update the data
UPDATE wealth_assets SET category = 'Real Estate Fund' WHERE category = 'Real Estate';

-- Add new constraint with updated categories
ALTER TABLE wealth_assets ADD CONSTRAINT wealth_assets_category_check 
CHECK (category IN ('Real Estate', 'Real Estate Fund', 'Vehicles', 'Marine', 'Art', 'Watches', 'Crypto', 'Cash', 'Other'));