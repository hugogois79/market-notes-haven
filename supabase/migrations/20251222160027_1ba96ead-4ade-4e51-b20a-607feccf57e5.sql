-- Create table for user saved filters
CREATE TABLE public.user_saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'workflow',
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_saved_filters ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own filters" 
ON public.user_saved_filters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own filters" 
ON public.user_saved_filters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filters" 
ON public.user_saved_filters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filters" 
ON public.user_saved_filters 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_saved_filters_updated_at
BEFORE UPDATE ON public.user_saved_filters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();