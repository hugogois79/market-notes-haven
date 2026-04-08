-- Add new fields to legal_cases table
ALTER TABLE public.legal_cases 
  ADD COLUMN IF NOT EXISTS case_number TEXT,
  ADD COLUMN IF NOT EXISTS date_opened DATE,
  ADD COLUMN IF NOT EXISTS case_type TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS description TEXT;