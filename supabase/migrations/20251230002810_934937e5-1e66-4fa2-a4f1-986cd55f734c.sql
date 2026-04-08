-- Add is_shared column to calendar_categories
ALTER TABLE public.calendar_categories 
ADD COLUMN is_shared boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.calendar_categories.is_shared IS 'When true, events with this category are visible to all users';