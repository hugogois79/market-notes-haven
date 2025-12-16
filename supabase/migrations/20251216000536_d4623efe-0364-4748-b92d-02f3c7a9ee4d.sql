-- Add columns to store custom category and status options for each folder
ALTER TABLE public.company_folders
ADD COLUMN category_options text[] DEFAULT ARRAY[]::text[],
ADD COLUMN status_options text[] DEFAULT ARRAY[]::text[];