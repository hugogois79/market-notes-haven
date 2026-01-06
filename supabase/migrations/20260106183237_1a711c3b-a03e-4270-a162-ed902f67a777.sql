-- Create securities table for reusable security definitions
CREATE TABLE public.securities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  ticker TEXT,
  isin TEXT,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.securities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own securities" 
ON public.securities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own securities" 
ON public.securities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own securities" 
ON public.securities FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own securities" 
ON public.securities FOR DELETE 
USING (auth.uid() = user_id);

-- Add isin column to market_holdings
ALTER TABLE public.market_holdings ADD COLUMN isin TEXT;

-- Add security_id reference to market_holdings (optional link)
ALTER TABLE public.market_holdings ADD COLUMN security_id UUID REFERENCES public.securities(id);