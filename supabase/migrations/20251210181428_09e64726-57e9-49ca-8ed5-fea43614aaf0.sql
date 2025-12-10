-- Recreate the trigger function and trigger
CREATE OR REPLACE FUNCTION public.create_loan_for_cross_company_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bank_company_id uuid;
BEGIN
  -- Only process if there's a bank account selected
  IF NEW.bank_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the company that owns the bank account
  SELECT ba.company_id INTO bank_company_id
  FROM public.bank_accounts ba
  WHERE ba.id = NEW.bank_account_id;
  
  -- If bank account company is different from transaction company, create a loan
  IF bank_company_id IS NOT NULL AND bank_company_id != NEW.company_id THEN
    -- For UPDATE: only create loan if bank_account_id changed
    IF TG_OP = 'UPDATE' THEN
      IF OLD.bank_account_id IS NOT DISTINCT FROM NEW.bank_account_id THEN
        RETURN NEW;
      END IF;
    END IF;
    
    -- Create the loan: bank account owner lends to transaction company
    INSERT INTO public.company_loans (
      lending_company_id,
      borrowing_company_id,
      amount,
      start_date,
      description,
      status
    ) VALUES (
      bank_company_id,
      NEW.company_id,
      NEW.total_amount,
      NEW.date,
      'Pagamento automático: ' || COALESCE(NEW.description, 'Transação #' || NEW.id::text),
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS create_loan_on_cross_company_payment ON public.financial_transactions;

CREATE TRIGGER create_loan_on_cross_company_payment
  AFTER INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_loan_for_cross_company_payment();

-- Also create the loan manually for the existing transaction
INSERT INTO public.company_loans (
  lending_company_id,
  borrowing_company_id,
  amount,
  start_date,
  description,
  status
)
SELECT 
  ba.company_id,
  ft.company_id,
  ft.total_amount,
  ft.date,
  'Pagamento automático: ' || ft.description,
  'active'
FROM public.financial_transactions ft
JOIN public.bank_accounts ba ON ba.id = ft.bank_account_id
WHERE ft.id = '5044ba96-6241-4e70-9862-ae7117228817'
  AND ba.company_id != ft.company_id;