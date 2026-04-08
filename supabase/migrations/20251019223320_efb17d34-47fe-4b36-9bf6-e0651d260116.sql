-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Create enum for transaction categories
CREATE TYPE transaction_category AS ENUM ('sales', 'materials', 'salaries', 'services', 'taxes', 'utilities', 'other');

-- Create enum for financial project status
CREATE TYPE financial_project_status AS ENUM ('active', 'completed', 'cancelled', 'on_hold');

-- Create enum for loan status
CREATE TYPE loan_status AS ENUM ('active', 'paid', 'overdue', 'cancelled');

-- Create enum for payment methods
CREATE TYPE financial_payment_method AS ENUM ('cash', 'bank_transfer', 'check', 'credit_card', 'debit_card', 'mbway', 'multibanco');

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT,
  initial_balance DECIMAL(15,2) DEFAULT 0 NOT NULL,
  current_balance DECIMAL(15,2) DEFAULT 0 NOT NULL,
  currency TEXT DEFAULT 'EUR' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create financial_projects table (renamed to avoid conflict)
CREATE TABLE public.financial_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  budget DECIMAL(15,2),
  start_date DATE NOT NULL,
  end_date DATE,
  status financial_project_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create financial_transactions table
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount_net DECIMAL(15,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method financial_payment_method NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  invoice_number TEXT,
  entity_name TEXT NOT NULL,
  project_id UUID REFERENCES public.financial_projects(id) ON DELETE SET NULL,
  invoice_file_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create company_loans table
CREATE TABLE public.company_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lending_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  borrowing_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_payment DECIMAL(15,2),
  status loan_status DEFAULT 'active' NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT different_companies CHECK (lending_company_id != borrowing_company_id)
);

-- Create company_users table (for managing company access)
CREATE TABLE public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'viewer' NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(company_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_companies_owner ON public.companies(owner_id);
CREATE INDEX idx_bank_accounts_company ON public.bank_accounts(company_id);
CREATE INDEX idx_financial_projects_company ON public.financial_projects(company_id);
CREATE INDEX idx_financial_projects_status ON public.financial_projects(status);
CREATE INDEX idx_transactions_company ON public.financial_transactions(company_id);
CREATE INDEX idx_transactions_date ON public.financial_transactions(date);
CREATE INDEX idx_transactions_project ON public.financial_transactions(project_id);
CREATE INDEX idx_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_loans_lending ON public.company_loans(lending_company_id);
CREATE INDEX idx_loans_borrowing ON public.company_loans(borrowing_company_id);
CREATE INDEX idx_company_users_company ON public.company_users(company_id);
CREATE INDEX idx_company_users_user ON public.company_users(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_financial_projects_updated_at
  BEFORE UPDATE ON public.financial_projects
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.company_loans
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

-- Create function to calculate account balance
CREATE OR REPLACE FUNCTION calculate_account_balance(account_id UUID, company_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  initial_balance DECIMAL(15,2);
  income_total DECIMAL(15,2);
  expense_total DECIMAL(15,2);
BEGIN
  -- Get initial balance
  SELECT ba.initial_balance INTO initial_balance
  FROM public.bank_accounts ba
  WHERE ba.id = account_id AND ba.company_id = company_id;
  
  -- Calculate total income
  SELECT COALESCE(SUM(total_amount), 0) INTO income_total
  FROM public.financial_transactions
  WHERE bank_account_id = account_id 
    AND type = 'income'
    AND company_id = company_id;
  
  -- Calculate total expenses
  SELECT COALESCE(SUM(total_amount), 0) INTO expense_total
  FROM public.financial_transactions
  WHERE bank_account_id = account_id 
    AND type = 'expense'
    AND company_id = company_id;
  
  RETURN initial_balance + income_total - expense_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update bank account balance
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts
      SET current_balance = calculate_account_balance(NEW.bank_account_id, NEW.company_id)
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts
      SET current_balance = calculate_account_balance(OLD.bank_account_id, OLD.company_id)
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update bank account balance
CREATE TRIGGER update_bank_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_account_balance();

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their companies"
  ON public.companies FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their companies"
  ON public.companies FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view bank accounts from their companies"
  ON public.bank_accounts FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() OR
      id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage bank accounts"
  ON public.bank_accounts FOR ALL
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for financial_projects
CREATE POLICY "Users can view projects from their companies"
  ON public.financial_projects FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() OR
      id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage projects"
  ON public.financial_projects FOR ALL
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for financial_transactions
CREATE POLICY "Users can view transactions from their companies"
  ON public.financial_transactions FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() OR
      id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage transactions"
  ON public.financial_transactions FOR ALL
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for company_loans
CREATE POLICY "Users can view loans involving their companies"
  ON public.company_loans FOR SELECT
  USING (
    lending_company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() OR
      id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
    ) OR
    borrowing_company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() OR
      id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage loans"
  ON public.company_loans FOR ALL
  USING (
    lending_company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR
    borrowing_company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for company_users
CREATE POLICY "Users can view company_users from their companies"
  ON public.company_users FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage company users"
  ON public.company_users FOR ALL
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );