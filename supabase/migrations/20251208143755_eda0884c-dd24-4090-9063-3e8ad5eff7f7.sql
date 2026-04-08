-- Create loan payments table for tracking individual payments
CREATE TABLE public.loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.company_loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  paying_company_id UUID NOT NULL REFERENCES public.companies(id),
  receiving_company_id UUID NOT NULL REFERENCES public.companies(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view payments from their companies"
ON public.loan_payments
FOR SELECT
USING (
  paying_company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
  OR receiving_company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payments"
ON public.loan_payments
FOR ALL
USING (
  paying_company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
  OR receiving_company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_loan_payments_updated_at
  BEFORE UPDATE ON public.loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_updated_at();