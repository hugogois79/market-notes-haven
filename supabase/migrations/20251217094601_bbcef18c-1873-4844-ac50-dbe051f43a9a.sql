-- Add category column to workflow_files table
ALTER TABLE public.workflow_files 
ADD COLUMN IF NOT EXISTS category TEXT;