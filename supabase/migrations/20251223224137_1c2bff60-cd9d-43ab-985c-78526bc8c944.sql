-- Add source_file_id column to company_loans to link back to the original workflow file
ALTER TABLE public.company_loans ADD COLUMN source_file_id uuid;