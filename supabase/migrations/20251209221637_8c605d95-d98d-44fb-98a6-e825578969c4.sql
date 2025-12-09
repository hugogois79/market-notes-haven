-- Update match_notes function to include extensions schema in search_path
CREATE OR REPLACE FUNCTION public.match_notes(query_embedding vector, match_threshold double precision DEFAULT 0.78, match_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, content text, category text, summary text, created_at timestamp with time zone, updated_at timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
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
    notes.user_id = auth.uid()
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;