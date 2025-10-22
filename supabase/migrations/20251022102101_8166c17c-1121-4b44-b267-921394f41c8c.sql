-- Create table for expense requesters
CREATE TABLE public.expense_requesters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_requesters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active requesters"
ON public.expense_requesters
FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can manage requesters"
ON public.expense_requesters
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_expense_requesters_updated_at
BEFORE UPDATE ON public.expense_requesters
FOR EACH ROW
EXECUTE FUNCTION public.update_expense_claims_updated_at();

-- Add requester_id column to expense_claims
ALTER TABLE public.expense_claims
ADD COLUMN requester_id UUID REFERENCES public.expense_requesters(id);