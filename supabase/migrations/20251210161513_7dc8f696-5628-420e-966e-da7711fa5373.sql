-- Drop and recreate function with proper parameter names to fix ambiguity
DROP FUNCTION IF EXISTS public.calculate_account_balance(uuid, uuid);

CREATE FUNCTION public.calculate_account_balance(p_account_id uuid, p_company_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  initial_balance DECIMAL(15,2);
  income_total DECIMAL(15,2);
  expense_total DECIMAL(15,2);
BEGIN
  -- Get initial balance
  SELECT ba.initial_balance INTO initial_balance
  FROM public.bank_accounts ba
  WHERE ba.id = p_account_id AND ba.company_id = p_company_id;
  
  -- Calculate total income
  SELECT COALESCE(SUM(ft.total_amount), 0) INTO income_total
  FROM public.financial_transactions ft
  WHERE ft.bank_account_id = p_account_id 
    AND ft.type = 'income'
    AND ft.company_id = p_company_id;
  
  -- Calculate total expenses
  SELECT COALESCE(SUM(ft.total_amount), 0) INTO expense_total
  FROM public.financial_transactions ft
  WHERE ft.bank_account_id = p_account_id 
    AND ft.type = 'expense'
    AND ft.company_id = p_company_id;
  
  RETURN initial_balance + income_total - expense_total;
END;
$function$;

-- Update trigger function with search_path set
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts
      SET current_balance = public.calculate_account_balance(NEW.bank_account_id, NEW.company_id)
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts
      SET current_balance = public.calculate_account_balance(OLD.bank_account_id, OLD.company_id)
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$function$;