-- Create portfolio_snapshots table for weekly portfolio history
CREATE TABLE public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  total_value NUMERIC(20,2) NOT NULL,
  total_pl NUMERIC(20,2) NOT NULL,
  average_yield NUMERIC(10,4),
  asset_count INTEGER NOT NULL,
  allocation_by_category JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own snapshots"
ON public.portfolio_snapshots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
ON public.portfolio_snapshots FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots"
ON public.portfolio_snapshots FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_portfolio_snapshots_user_date ON public.portfolio_snapshots(user_id, snapshot_date DESC);