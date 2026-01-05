-- Wealth Assets table for all asset types
CREATE TABLE public.wealth_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Real Estate', 'Crypto', 'Fine Art', 'Watches', 'Vehicles', 'Private Equity', 'Cash', 'Other')),
  subcategory TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  current_value DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Recovery', 'Pending')),
  yield_percent DECIMAL(5,2),
  notes TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wealth Transactions for cashflow ledger
CREATE TABLE public.wealth_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  asset_id UUID REFERENCES public.wealth_assets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Market data for forex/crypto prices
CREATE TABLE public.wealth_market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  source TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portfolio snapshots for historical tracking
CREATE TABLE public.wealth_portfolio_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_assets DECIMAL(15,2) DEFAULT 0,
  total_liabilities DECIMAL(15,2) DEFAULT 0,
  net_worth DECIMAL(15,2) DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asset valuation history
CREATE TABLE public.wealth_asset_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.wealth_assets(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.wealth_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_asset_valuations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wealth_assets
CREATE POLICY "Users can view their own assets" ON public.wealth_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assets" ON public.wealth_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.wealth_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.wealth_assets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for wealth_transactions
CREATE POLICY "Users can view their own transactions" ON public.wealth_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.wealth_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.wealth_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.wealth_transactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for wealth_market_data (public read)
CREATE POLICY "Anyone can view market data" ON public.wealth_market_data FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert market data" ON public.wealth_market_data FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for wealth_portfolio_snapshots
CREATE POLICY "Users can view their own snapshots" ON public.wealth_portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own snapshots" ON public.wealth_portfolio_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for wealth_asset_valuations
CREATE POLICY "Users can view valuations of their assets" ON public.wealth_asset_valuations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wealth_assets WHERE id = asset_id AND user_id = auth.uid()));
CREATE POLICY "Users can create valuations for their assets" ON public.wealth_asset_valuations FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.wealth_assets WHERE id = asset_id AND user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_wealth_assets_user_id ON public.wealth_assets(user_id);
CREATE INDEX idx_wealth_assets_category ON public.wealth_assets(category);
CREATE INDEX idx_wealth_assets_status ON public.wealth_assets(status);
CREATE INDEX idx_wealth_transactions_user_id ON public.wealth_transactions(user_id);
CREATE INDEX idx_wealth_transactions_date ON public.wealth_transactions(date);
CREATE INDEX idx_wealth_market_data_symbol ON public.wealth_market_data(symbol);
CREATE INDEX idx_wealth_portfolio_snapshots_user_date ON public.wealth_portfolio_snapshots(user_id, snapshot_date);
CREATE INDEX idx_wealth_asset_valuations_asset_id ON public.wealth_asset_valuations(asset_id);

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_wealth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_wealth_assets_updated_at
  BEFORE UPDATE ON public.wealth_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_wealth_updated_at();

CREATE TRIGGER update_wealth_transactions_updated_at
  BEFORE UPDATE ON public.wealth_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wealth_updated_at();