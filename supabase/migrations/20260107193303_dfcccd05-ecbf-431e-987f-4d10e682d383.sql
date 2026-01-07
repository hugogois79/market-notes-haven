-- Add currency column to wealth_transactions table
ALTER TABLE public.wealth_transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';