-- Add soft delete column to wealth_assets
ALTER TABLE public.wealth_assets ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient filtering of non-deleted assets
CREATE INDEX idx_wealth_assets_deleted_at ON public.wealth_assets(deleted_at) WHERE deleted_at IS NULL;