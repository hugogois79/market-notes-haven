-- Fix ambiguous company_id in financial_transactions policies
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can view transactions from their companies" ON public.financial_transactions;

CREATE POLICY "Admins can manage transactions" ON public.financial_transactions
FOR ALL USING (
  public.financial_transactions.company_id IN (
    SELECT c.id FROM public.companies c WHERE c.owner_id = auth.uid()
    UNION
    SELECT cu.company_id FROM public.company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.role = ANY (ARRAY['admin'::text, 'manager'::text])
  )
);

CREATE POLICY "Users can view transactions from their companies" ON public.financial_transactions
FOR SELECT USING (
  public.financial_transactions.company_id IN (
    SELECT c.id FROM public.companies c 
    WHERE c.owner_id = auth.uid() OR c.id IN (
      SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
    )
  )
);

-- Fix ambiguous company_id in bank_accounts policies
DROP POLICY IF EXISTS "Admins can manage bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can view bank accounts from their companies" ON public.bank_accounts;

CREATE POLICY "Admins can manage bank accounts" ON public.bank_accounts
FOR ALL USING (
  public.bank_accounts.company_id IN (
    SELECT c.id FROM public.companies c WHERE c.owner_id = auth.uid()
    UNION
    SELECT cu.company_id FROM public.company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.role = ANY (ARRAY['admin'::text, 'manager'::text])
  )
);

CREATE POLICY "Users can view bank accounts from their companies" ON public.bank_accounts
FOR SELECT USING (
  public.bank_accounts.company_id IN (
    SELECT c.id FROM public.companies c 
    WHERE c.owner_id = auth.uid() OR c.id IN (
      SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
    )
  )
);