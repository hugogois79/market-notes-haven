-- Add category column to monthly_objectives table
ALTER TABLE public.monthly_objectives 
ADD COLUMN category TEXT DEFAULT NULL;