-- Create a sequence for receipt numbers
CREATE SEQUENCE IF NOT EXISTS receipt_number_sequence START 1;

-- Create receipts table with sequential payment number
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number INTEGER NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.receipt_companies(id) ON DELETE SET NULL,
  
  -- Receipt content
  raw_content TEXT NOT NULL,
  formatted_content TEXT NOT NULL,
  
  -- Payment details
  beneficiary_name TEXT,
  payment_amount TEXT,
  payment_date DATE,
  payment_reference TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create function to automatically set receipt number
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number = nextval('receipt_number_sequence');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before insert
CREATE TRIGGER set_receipt_number_trigger
BEFORE INSERT ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION set_receipt_number();

-- Create trigger for updated_at
CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own receipts"
ON public.receipts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
ON public.receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
ON public.receipts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
ON public.receipts
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_receipts_receipt_number ON public.receipts(receipt_number);