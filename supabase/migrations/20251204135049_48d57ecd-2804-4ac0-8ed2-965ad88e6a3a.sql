-- Create legal_billable_items table
CREATE TABLE public.legal_billable_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  invoice_number TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'fees',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  attachment_url TEXT,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_billable_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own billable items"
  ON public.legal_billable_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own billable items"
  ON public.legal_billable_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billable items"
  ON public.legal_billable_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own billable items"
  ON public.legal_billable_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_legal_billable_items_updated_at
  BEFORE UPDATE ON public.legal_billable_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();