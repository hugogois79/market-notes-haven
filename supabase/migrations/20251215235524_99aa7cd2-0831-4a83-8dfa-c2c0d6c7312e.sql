-- Add category and status fields to company_folders
ALTER TABLE public.company_folders 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS status TEXT;