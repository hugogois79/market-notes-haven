-- Create market_holdings table for tracking investment holdings within Cash accounts
CREATE TABLE public.market_holdings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL REFERENCES wealth_assets(id) ON DELETE CASCADE,
  name text NOT NULL,
  ticker text,
  weight_target numeric DEFAULT 0,
  weight_current numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  cost_basis numeric DEFAULT 0,
  quantity numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_holdings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own market holdings"
ON public.market_holdings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own market holdings"
ON public.market_holdings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own market holdings"
ON public.market_holdings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own market holdings"
ON public.market_holdings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_market_holdings_updated_at
BEFORE UPDATE ON public.market_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_market_holdings_asset_id ON public.market_holdings(asset_id);
CREATE INDEX idx_market_holdings_user_id ON public.market_holdings(user_id);