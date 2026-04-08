-- Add asset_id and milestone_type to wealth_milestones
ALTER TABLE public.wealth_milestones
ADD COLUMN asset_id UUID REFERENCES public.wealth_assets(id) ON DELETE SET NULL,
ADD COLUMN milestone_type TEXT DEFAULT 'portfolio' CHECK (milestone_type IN ('portfolio', 'buy', 'sell'));