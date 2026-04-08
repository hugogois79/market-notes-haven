-- Fix PUBLIC_DATA_EXPOSURE: Make note_attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'note_attachments';

-- Drop overly permissive storage policy
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can view their own note attachments" ON storage.objects;

-- Create user-scoped view policy for note_attachments
CREATE POLICY "Users can view their own note attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'note_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix MISSING_RLS: Enable RLS on tables without it

-- scheduled_calls - contains customer reservation data with phone numbers
ALTER TABLE IF EXISTS scheduled_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access scheduled_calls" ON scheduled_calls;
CREATE POLICY "Only admins can access scheduled_calls"
ON scheduled_calls FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- restaurants - contains restaurant contact details
ALTER TABLE IF EXISTS restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Only admins can modify restaurants" ON restaurants;

CREATE POLICY "Authenticated users can view restaurants"
ON restaurants FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify restaurants"
ON restaurants FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- restaurant_notes - contains operational notes
ALTER TABLE IF EXISTS restaurant_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view restaurant_notes" ON restaurant_notes;
DROP POLICY IF EXISTS "Only admins can modify restaurant_notes" ON restaurant_notes;

CREATE POLICY "Authenticated users can view restaurant_notes"
ON restaurant_notes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify restaurant_notes"
ON restaurant_notes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- pending_confirmations - booking confirmations
ALTER TABLE IF EXISTS pending_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access pending_confirmations" ON pending_confirmations;
CREATE POLICY "Only admins can access pending_confirmations"
ON pending_confirmations FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- reminders - user reminders
ALTER TABLE IF EXISTS reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access reminders" ON reminders;
CREATE POLICY "Only admins can access reminders"
ON reminders FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- retry_queue - system retry queue
ALTER TABLE IF EXISTS retry_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access retry_queue" ON retry_queue;
CREATE POLICY "Only admins can access retry_queue"
ON retry_queue FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- economic_events - public market data (intentional but documented)
ALTER TABLE IF EXISTS economic_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view economic_events" ON economic_events;
DROP POLICY IF EXISTS "Only admins can modify economic_events" ON economic_events;
DROP POLICY IF EXISTS "Only admins can update economic_events" ON economic_events;
DROP POLICY IF EXISTS "Only admins can delete economic_events" ON economic_events;

CREATE POLICY "Authenticated users can view economic_events"
ON economic_events FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert economic_events"
ON economic_events FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update economic_events"
ON economic_events FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete economic_events"
ON economic_events FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- kanban_cards - enable RLS (already has policies but RLS was disabled)
ALTER TABLE IF EXISTS kanban_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view kanban cards from their boards" ON kanban_cards;
DROP POLICY IF EXISTS "Users can insert kanban cards to their boards" ON kanban_cards;
DROP POLICY IF EXISTS "Users can update kanban cards on their boards" ON kanban_cards;
DROP POLICY IF EXISTS "Users can delete kanban cards from their boards" ON kanban_cards;

-- Create proper RLS policies for kanban_cards
CREATE POLICY "Users can view kanban cards from their boards"
ON kanban_cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM kanban_lists kl
    JOIN kanban_boards kb ON kl.board_id = kb.id
    WHERE kl.id = kanban_cards.list_id
    AND (kb.user_id = auth.uid() OR kb.is_shared = true)
  )
);

CREATE POLICY "Users can insert kanban cards to their boards"
ON kanban_cards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM kanban_lists kl
    JOIN kanban_boards kb ON kl.board_id = kb.id
    WHERE kl.id = list_id
    AND (kb.user_id = auth.uid() OR kb.is_shared = true)
  )
);

CREATE POLICY "Users can update kanban cards on their boards"
ON kanban_cards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM kanban_lists kl
    JOIN kanban_boards kb ON kl.board_id = kb.id
    WHERE kl.id = kanban_cards.list_id
    AND (kb.user_id = auth.uid() OR kb.is_shared = true)
  )
);

CREATE POLICY "Users can delete kanban cards from their boards"
ON kanban_cards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM kanban_lists kl
    JOIN kanban_boards kb ON kl.board_id = kb.id
    WHERE kl.id = kanban_cards.list_id
    AND (kb.user_id = auth.uid() OR kb.is_shared = true)
  )
);

-- Add comment for documentation
COMMENT ON TABLE economic_events IS 'Public economic calendar data - intentionally accessible to all authenticated users for read access';