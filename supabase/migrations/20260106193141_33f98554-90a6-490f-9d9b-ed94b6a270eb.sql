-- Create stock_prices table for caching stock data
CREATE TABLE public.stock_prices (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  open_price DECIMAL(12,4),
  high_price DECIMAL(12,4),
  low_price DECIMAL(12,4),
  current_price DECIMAL(12,4),
  volume BIGINT,
  latest_trading_day DATE,
  previous_close DECIMAL(12,4),
  change DECIMAL(12,4),
  change_percent VARCHAR(10),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, latest_trading_day)
);

-- Enable RLS
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read stock prices (shared cache)
CREATE POLICY "Anyone can read stock prices"
ON public.stock_prices
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert/update stock prices
CREATE POLICY "Authenticated users can insert stock prices"
ON public.stock_prices
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock prices"
ON public.stock_prices
FOR UPDATE
TO authenticated
USING (true);