-- Add is_requester and feature_permissions columns to expense_users
ALTER TABLE public.expense_users
ADD COLUMN IF NOT EXISTS is_requester BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_permissions JSONB DEFAULT '{
  "expenses": false,
  "receipt_generator": false,
  "calendar": false,
  "finance": false,
  "legal": false,
  "projects": false,
  "notes": false,
  "tao": false
}'::jsonb;

-- Migrate existing requesters data: mark users as requesters if they exist in expense_requesters
UPDATE public.expense_users eu
SET 
  is_requester = true,
  assigned_project_ids = COALESCE(
    (SELECT er.assigned_project_ids FROM public.expense_requesters er WHERE LOWER(er.name) = LOWER(eu.name) LIMIT 1),
    eu.assigned_project_ids
  )
WHERE EXISTS (
  SELECT 1 FROM public.expense_requesters er WHERE LOWER(er.name) = LOWER(eu.name)
);

-- For requesters that don't have a matching user, we'll need to handle them in the UI
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_expense_users_is_requester ON public.expense_users(is_requester) WHERE is_requester = true;