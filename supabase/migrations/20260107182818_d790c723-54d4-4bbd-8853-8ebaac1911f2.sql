-- Create market_movements table for tracking buy/sell/dividend transactions
CREATE TABLE public.market_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  holding_id UUID NOT NULL REFERENCES public.market_holdings(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('buy', 'sell', 'dividend', 'split', 'transfer_in', 'transfer_out', 'fee')),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity NUMERIC,
  price_per_unit NUMERIC,
  total_value NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.market_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own market movements"
  ON public.market_movements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own market movements"
  ON public.market_movements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own market movements"
  ON public.market_movements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own market movements"
  ON public.market_movements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_market_movements_updated_at
  BEFORE UPDATE ON public.market_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_market_movements_holding_id ON public.market_movements(holding_id);
CREATE INDEX idx_market_movements_user_id ON public.market_movements(user_id);
CREATE INDEX idx_market_movements_date ON public.market_movements(movement_date DESC);