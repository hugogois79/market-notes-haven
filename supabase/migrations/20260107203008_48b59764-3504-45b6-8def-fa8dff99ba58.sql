-- Add affects_asset_value column to wealth_transactions
-- When FALSE, transaction will NOT impact asset value in forecast calculations
-- Useful for commissions, maintenance, insurance and other expenses linked to assets

ALTER TABLE public.wealth_transactions 
ADD COLUMN affects_asset_value BOOLEAN DEFAULT TRUE;