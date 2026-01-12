-- Fix SECURITY DEFINER view by adding security_invoker = true
-- This ensures the view respects the caller's RLS policies

DROP VIEW IF EXISTS public.ai_board_structure;

CREATE VIEW public.ai_board_structure 
WITH (security_invoker = true)
AS SELECT 
    b.title AS board_name,
    b.id AS board_id,
    l.title AS list_name,
    l.id AS list_id
FROM kanban_boards b
LEFT JOIN kanban_lists l ON l.board_id = b.id AND (l.archived = false OR l.archived IS NULL)
WHERE b.archived = false
ORDER BY b.title, l.position;