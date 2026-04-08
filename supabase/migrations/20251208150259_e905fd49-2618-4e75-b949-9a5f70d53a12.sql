-- Add attachment_url column to company_loans table
ALTER TABLE public.company_loans 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;