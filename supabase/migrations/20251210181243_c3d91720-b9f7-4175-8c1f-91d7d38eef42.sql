-- Update the trigger function to also handle UPDATE operations
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
    -- For UPDATE: only create loan if bank_account_id changed or this is a new cross-company scenario
    IF TG_OP = 'UPDATE' THEN
      -- Skip if bank_account_id hasn't changed
      IF OLD.bank_account_id = NEW.bank_account_id THEN
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
      bank_company_id,                    -- Company that paid (owns the bank account)
      NEW.company_id,                     -- Company that received the payment (invoice company)
      NEW.total_amount,                   -- Amount of the transaction
      NEW.date,                           -- Date of the transaction
      'Pagamento automático: ' || COALESCE(NEW.description, 'Transação #' || NEW.id::text),
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop and recreate trigger to include UPDATE
DROP TRIGGER IF EXISTS create_loan_on_cross_company_payment ON public.financial_transactions;

CREATE TRIGGER create_loan_on_cross_company_payment
  AFTER INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_loan_for_cross_company_payment();