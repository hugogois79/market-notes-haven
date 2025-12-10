-- Fix the update_bank_account_balance trigger to handle cross-company transactions
-- When a transaction uses a bank account from a different company, we need to use the bank account's company_id
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  account_company_id uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      -- Get the bank account's actual company_id
      SELECT ba.company_id INTO account_company_id
      FROM public.bank_accounts ba
      WHERE ba.id = NEW.bank_account_id;
      
      -- Update balance using the bank account's company_id
      UPDATE public.bank_accounts
      SET current_balance = public.calculate_account_balance_v2(NEW.bank_account_id)
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts
      SET current_balance = public.calculate_account_balance_v2(OLD.bank_account_id)
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Create a new version of calculate_account_balance that only needs the account_id
-- It will get the company_id from the bank_accounts table itself
CREATE OR REPLACE FUNCTION public.calculate_account_balance_v2(p_account_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  initial_bal DECIMAL(15,2);
  income_total DECIMAL(15,2);
  expense_total DECIMAL(15,2);
BEGIN
  -- Get initial balance from the bank account
  SELECT ba.initial_balance INTO initial_bal
  FROM public.bank_accounts ba
  WHERE ba.id = p_account_id;
  
  -- If account not found, return 0
  IF initial_bal IS NULL THEN
    initial_bal := 0;
  END IF;
  
  -- Calculate total income (all transactions using this bank account, regardless of company)
  SELECT COALESCE(SUM(ft.total_amount), 0) INTO income_total
  FROM public.financial_transactions ft
  WHERE ft.bank_account_id = p_account_id 
    AND ft.type = 'income';
  
  -- Calculate total expenses (all transactions using this bank account, regardless of company)
  SELECT COALESCE(SUM(ft.total_amount), 0) INTO expense_total
  FROM public.financial_transactions ft
  WHERE ft.bank_account_id = p_account_id 
    AND ft.type = 'expense';
  
  RETURN initial_bal + income_total - expense_total;
END;
$function$;