-- Update match_notes function to accept user_id parameter
CREATE OR REPLACE FUNCTION public.match_notes(
  query_embedding vector, 
  match_threshold double precision DEFAULT 0.78, 
  match_count integer DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
 RETURNS TABLE(id uuid, title text, content text, category text, summary text, created_at timestamp with time zone, updated_at timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  effective_user_id uuid;
BEGIN
  -- Use provided user_id or fall back to auth.uid()
  effective_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT
    notes.id,
    notes.title,
    notes.content,
    notes.category,
    notes.summary,
    notes.created_at,
    notes.updated_at,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE 
    notes.user_id = effective_user_id
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;