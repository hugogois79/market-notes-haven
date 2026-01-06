-- Create wealth_asset_notes table for research notes on assets
CREATE TABLE public.wealth_asset_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.wealth_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wealth_asset_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own asset notes"
ON public.wealth_asset_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own asset notes"
ON public.wealth_asset_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asset notes"
ON public.wealth_asset_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asset notes"
ON public.wealth_asset_notes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_wealth_asset_notes_updated_at
BEFORE UPDATE ON public.wealth_asset_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_wealth_updated_at();

-- Index for faster lookups
CREATE INDEX idx_wealth_asset_notes_asset ON public.wealth_asset_notes(asset_id);