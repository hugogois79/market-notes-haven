-- Drop the old foreign key constraint FIRST
ALTER TABLE public.expense_claims 
DROP CONSTRAINT IF EXISTS expense_claims_requester_id_fkey;

-- Update expense_claims to use expense_users IDs based on matching emails
UPDATE public.expense_claims ec
SET requester_id = eu.id
FROM public.expense_users eu
JOIN public.expense_requesters er ON er.email = eu.email
WHERE ec.requester_id = er.id
  AND eu.is_requester = true;

-- Set orphaned requester_ids to NULL (requesters without corresponding expense_users)
UPDATE public.expense_claims ec
SET requester_id = NULL
WHERE ec.requester_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.expense_users eu WHERE eu.id = ec.requester_id
  );

-- Add new foreign key constraint referencing expense_users
ALTER TABLE public.expense_claims 
ADD CONSTRAINT expense_claims_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES public.expense_users(id) 
ON DELETE SET NULL;