-- Add source_transaction_id to track which loans came from which transactions
ALTER TABLE public.company_loans 
ADD COLUMN IF NOT EXISTS source_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_loans_source_transaction 
ON public.company_loans(source_transaction_id) 
WHERE source_transaction_id IS NOT NULL;

-- Update the trigger function to properly handle updates
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
  
  -- If bank account company is different from transaction company
  IF bank_company_id IS NOT NULL AND bank_company_id != NEW.company_id THEN
    -- Check if a loan already exists for this transaction
    SELECT id INTO existing_loan_id
    FROM public.company_loans
    WHERE source_transaction_id = NEW.id
    LIMIT 1;
    
    -- Only create loan if one doesn't already exist for this transaction
    IF existing_loan_id IS NULL THEN
      INSERT INTO public.company_loans (
        lending_company_id,
        borrowing_company_id,
        amount,
        start_date,
        description,
        status,
        source_transaction_id
      ) VALUES (
        bank_company_id,
        NEW.company_id,
        NEW.total_amount,
        NEW.date,
        'Pagamento automático: ' || COALESCE(NEW.description, 'Transação #' || NEW.id::text),
        'active',
        NEW.id
      );
    ELSE
      -- Update existing loan amount if transaction amount changed
      UPDATE public.company_loans
      SET amount = NEW.total_amount,
          start_date = NEW.date,
          description = 'Pagamento automático: ' || COALESCE(NEW.description, 'Transação #' || NEW.id::text)
      WHERE id = existing_loan_id;
    END IF;
  ELSE
    -- If transaction is no longer cross-company, delete the auto-created loan
    DELETE FROM public.company_loans
    WHERE source_transaction_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;