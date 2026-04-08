-- Fix critical security issues: expense_reports and expense_categories RLS policies

-- =============================================
-- PART 1: Fix expense_reports table
-- =============================================

-- Add user_id column to expense_reports
ALTER TABLE public.expense_reports 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set user_id to the authenticated user for new inserts (we'll handle existing data separately)
-- Note: For existing rows without user_id, they will remain null until manually assigned

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can create expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can update expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can delete expense reports" ON public.expense_reports;

-- Create new restrictive policies for expense_reports
CREATE POLICY "Users can view their own expense reports"
ON public.expense_reports
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own expense reports"
ON public.expense_reports
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own expense reports"
ON public.expense_reports
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own expense reports"
ON public.expense_reports
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- PART 2: Fix expense_categories table
-- =============================================

-- Add user_id column to expense_categories to make them user-specific
ALTER TABLE public.expense_categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Anyone can create categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.expense_categories;

-- Create new restrictive policies for expense_categories
CREATE POLICY "Users can view their own expense categories"
ON public.expense_categories
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own expense categories"
ON public.expense_categories
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own expense categories"
ON public.expense_categories
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own expense categories"
ON public.expense_categories
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- PART 3: Fix Security Definer View
-- =============================================

-- Drop and recreate the tag_usage_counts view with proper security context
-- The view should use SECURITY INVOKER (default) to enforce RLS from the querying user's perspective
DROP VIEW IF EXISTS public.tag_usage_counts CASCADE;

CREATE VIEW public.tag_usage_counts 
WITH (security_invoker = true)
AS
SELECT 
  t.id,
  t.name,
  t.user_id,
  t.category_id,
  t.color,
  t.created_at,
  t.updated_at,
  COUNT(nt.note_id) as usage_count
FROM public.tags t
LEFT JOIN public.note_tags nt ON t.id = nt.tag_id
GROUP BY t.id, t.name, t.user_id, t.category_id, t.color, t.created_at, t.updated_at;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.tag_usage_counts TO authenticated;