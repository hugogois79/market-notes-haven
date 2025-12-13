-- Add period field to calendar_events for morning/afternoon slots
ALTER TABLE public.calendar_events 
ADD COLUMN period text DEFAULT 'morning' CHECK (period IN ('morning', 'afternoon'));