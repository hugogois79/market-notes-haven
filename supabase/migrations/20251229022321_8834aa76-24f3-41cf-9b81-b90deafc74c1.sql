-- Change payment_date column from date to text to accept localized date formats
ALTER TABLE public.receipts 
ALTER COLUMN payment_date TYPE text;