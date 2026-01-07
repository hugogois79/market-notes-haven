-- Create junction table to link notes to wealth assets
CREATE TABLE public.wealth_asset_note_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.wealth_assets(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(asset_id, note_id)
);

-- Enable RLS
ALTER TABLE public.wealth_asset_note_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own asset note links"
ON public.wealth_asset_note_links
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own asset note links"
ON public.wealth_asset_note_links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asset note links"
ON public.wealth_asset_note_links
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_wealth_asset_note_links_asset_id ON public.wealth_asset_note_links(asset_id);
CREATE INDEX idx_wealth_asset_note_links_note_id ON public.wealth_asset_note_links(note_id);