-- Add column to store specific users to share categories with
ALTER TABLE public.calendar_categories 
ADD COLUMN IF NOT EXISTS shared_with_users uuid[] DEFAULT '{}';