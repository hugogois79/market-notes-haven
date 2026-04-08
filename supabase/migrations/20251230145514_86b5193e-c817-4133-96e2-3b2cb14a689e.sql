-- Fix calendar_events SELECT policy to match normalized category values
-- (events store category as snake_case; categories store display name)

DROP POLICY IF EXISTS "Users can view own and shared category events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.calendar_events;

CREATE POLICY "Users can view own and shared category events"
ON public.calendar_events
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.calendar_categories cc
    WHERE cc.user_id = calendar_events.user_id
      AND auth.uid() = ANY(COALESCE(cc.shared_with_users, ARRAY[]::uuid[]))
      AND lower(calendar_events.category) = regexp_replace(lower(cc.name), '\\s+', '_', 'g')
  )
);