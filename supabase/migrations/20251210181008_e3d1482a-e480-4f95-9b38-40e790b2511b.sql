-- Create a trigger function to automatically create loans when a transaction is paid by a different company
CREATE OR REPLACE FUNCTION public.create_loan_for_cross_company_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bank_company_id uuid;
  existing_loan_id uuid;
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
    -- Check if we're updating and need to handle the old loan
    IF TG_OP = 'UPDATE' THEN
      -- For now, we'll just create new loans on insert
      -- Updates are more complex (would need to track which loan was created)
      RETURN NEW;
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

-- Create the trigger on financial_transactions
DROP TRIGGER IF EXISTS create_loan_on_cross_company_payment ON public.financial_transactions;

CREATE TRIGGER create_loan_on_cross_company_payment
  AFTER INSERT ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_loan_for_cross_company_payment();