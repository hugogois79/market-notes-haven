-- Fix ambiguous company_id using explicit table references
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can view transactions from their companies" ON public.financial_transactions;
DROP POLICY IF EXISTS "Admins can manage bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can view bank accounts from their companies" ON public.bank_accounts;

-- Use the existing helper function for cleaner policies
CREATE POLICY "Users can manage transactions for their companies" ON public.financial_transactions
FOR ALL USING (
  public.user_can_access_company(auth.uid(), financial_transactions.company_id)
);

CREATE POLICY "Users can manage bank accounts for their companies" ON public.bank_accounts
FOR ALL USING (
  public.user_can_access_company(auth.uid(), bank_accounts.company_id)
);