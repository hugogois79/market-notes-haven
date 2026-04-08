-- Create table for calendar day status (custody and holidays)
CREATE TABLE public.calendar_day_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  beatriz_status TEXT, -- 'comigo' | 'com_mae' | null
  diana_status TEXT, -- 'comigo' | null
  is_holiday BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.calendar_day_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own day status"
ON public.calendar_day_status
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own day status"
ON public.calendar_day_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own day status"
ON public.calendar_day_status
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own day status"
ON public.calendar_day_status
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_day_status_updated_at
BEFORE UPDATE ON public.calendar_day_status
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster date lookups
CREATE INDEX idx_calendar_day_status_user_date ON public.calendar_day_status(user_id, date);