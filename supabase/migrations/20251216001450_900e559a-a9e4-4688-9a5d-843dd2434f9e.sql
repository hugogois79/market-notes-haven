-- Drop and recreate columns as JSONB (they are new and likely empty)
ALTER TABLE public.company_folders
DROP COLUMN IF EXISTS category_options,
DROP COLUMN IF EXISTS status_options;

ALTER TABLE public.company_folders
ADD COLUMN category_options JSONB DEFAULT '[]'::JSONB,
ADD COLUMN status_options JSONB DEFAULT '[]'::JSONB;