-- Create table to store event titles with their associated categories
CREATE TABLE public.calendar_event_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, title)
);

-- Enable RLS
ALTER TABLE public.calendar_event_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own event templates" 
ON public.calendar_event_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own event templates" 
ON public.calendar_event_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event templates" 
ON public.calendar_event_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event templates" 
ON public.calendar_event_templates 
FOR DELETE 
USING (auth.uid() = user_id);