-- Drop tables if they exist (to start fresh)
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.expense_claims CASCADE;

-- Create expense_claims table
CREATE TABLE public.expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  claim_number SERIAL UNIQUE,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('reembolso', 'justificacao_cartao')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'submetido', 'aprovado', 'pago', 'rejeitado')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  submission_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_claim_id UUID NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  supplier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  project_id UUID,
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign keys
ALTER TABLE public.expense_claims 
  ADD CONSTRAINT fk_expense_claims_employee 
  FOREIGN KEY (employee_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.expenses 
  ADD CONSTRAINT fk_expenses_claim 
  FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id) ON DELETE CASCADE;

ALTER TABLE public.expenses 
  ADD CONSTRAINT fk_expenses_project 
  FOREIGN KEY (project_id) REFERENCES public.financial_projects(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_expense_claims_employee ON public.expense_claims(employee_id);
CREATE INDEX idx_expense_claims_status ON public.expense_claims(status);
CREATE INDEX idx_expenses_claim ON public.expenses(expense_claim_id);

-- Enable RLS
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_claims
CREATE POLICY "Users can view their own expense claims"
  ON public.expense_claims FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert their own expense claims"
  ON public.expense_claims FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update their own expense claims"
  ON public.expense_claims FOR UPDATE
  USING (auth.uid() = employee_id);

CREATE POLICY "Users can delete their own expense claims"
  ON public.expense_claims FOR DELETE
  USING (auth.uid() = employee_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses from their claims"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_claims 
      WHERE id = expenses.expense_claim_id 
      AND employee_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses to their claims"
  ON public.expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expense_claims 
      WHERE id = expense_claim_id 
      AND employee_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses from their claims"
  ON public.expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_claims 
      WHERE id = expense_claim_id 
      AND employee_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses from their claims"
  ON public.expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_claims 
      WHERE id = expense_claim_id 
      AND employee_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_expense_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expense_claims_updated_at
  BEFORE UPDATE ON public.expense_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_claims_updated_at();