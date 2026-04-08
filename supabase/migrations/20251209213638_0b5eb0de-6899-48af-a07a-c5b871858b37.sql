-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create an index for faster similarity search
CREATE INDEX IF NOT EXISTS notes_embedding_idx 
ON public.notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create the match_notes RPC function for cosine similarity search
CREATE OR REPLACE FUNCTION public.match_notes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  summary text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;