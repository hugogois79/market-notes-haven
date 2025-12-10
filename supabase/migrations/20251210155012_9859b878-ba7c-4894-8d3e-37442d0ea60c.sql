-- Drop and recreate bank_accounts policies with qualified column names
DROP POLICY IF EXISTS "Admins can manage bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can view bank accounts from their companies" ON bank_accounts;

CREATE POLICY "Admins can manage bank accounts" ON bank_accounts
FOR ALL USING (
  bank_accounts.company_id IN (
    SELECT companies.id FROM companies WHERE companies.owner_id = auth.uid()
    UNION
    SELECT company_users.company_id FROM company_users 
    WHERE company_users.user_id = auth.uid() AND company_users.role = ANY (ARRAY['admin'::text, 'manager'::text])
  )
);

CREATE POLICY "Users can view bank accounts from their companies" ON bank_accounts
FOR SELECT USING (
  bank_accounts.company_id IN (
    SELECT companies.id FROM companies 
    WHERE companies.owner_id = auth.uid() OR companies.id IN (
      SELECT company_users.company_id FROM company_users WHERE company_users.user_id = auth.uid()
    )
  )
);

-- Drop and recreate financial_transactions policies with qualified column names
DROP POLICY IF EXISTS "Admins can manage transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can view transactions from their companies" ON financial_transactions;

CREATE POLICY "Admins can manage transactions" ON financial_transactions
FOR ALL USING (
  financial_transactions.company_id IN (
    SELECT companies.id FROM companies WHERE companies.owner_id = auth.uid()
    UNION
    SELECT company_users.company_id FROM company_users 
    WHERE company_users.user_id = auth.uid() AND company_users.role = ANY (ARRAY['admin'::text, 'manager'::text])
  )
);

CREATE POLICY "Users can view transactions from their companies" ON financial_transactions
FOR SELECT USING (
  financial_transactions.company_id IN (
    SELECT companies.id FROM companies 
    WHERE companies.owner_id = auth.uid() OR companies.id IN (
      SELECT company_users.company_id FROM company_users WHERE company_users.user_id = auth.uid()
    )
  )
);