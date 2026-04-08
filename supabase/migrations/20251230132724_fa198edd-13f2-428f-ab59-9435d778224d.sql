
-- Drop existing SELECT policy for calendar_events
DROP POLICY IF EXISTS "Users can view their own events" ON calendar_events;

-- Create new SELECT policy that includes events from shared categories
CREATE POLICY "Users can view own and shared category events" 
ON calendar_events 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  category IN (
    SELECT name FROM calendar_categories 
    WHERE auth.uid() = ANY(shared_with_users)
  )
);
