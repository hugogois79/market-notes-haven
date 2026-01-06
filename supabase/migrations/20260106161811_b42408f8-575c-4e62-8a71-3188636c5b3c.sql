-- Add proceeds destination fields for sell milestones
ALTER TABLE wealth_milestones 
ADD COLUMN IF NOT EXISTS proceeds_destination_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS proceeds_destination_asset_id uuid REFERENCES wealth_assets(id) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN wealth_milestones.proceeds_destination_type IS 'Where proceeds go: cash or asset';
COMMENT ON COLUMN wealth_milestones.proceeds_destination_asset_id IS 'Target asset ID when proceeds go to another asset';