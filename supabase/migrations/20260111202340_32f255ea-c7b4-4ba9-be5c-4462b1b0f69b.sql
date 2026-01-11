-- Add cluster_index column to notes table to persist cluster assignments
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS cluster_index integer DEFAULT NULL;

-- Create index for faster filtering by cluster
CREATE INDEX IF NOT EXISTS idx_notes_cluster_index ON public.notes(cluster_index) WHERE cluster_index IS NOT NULL;

-- Function to recalculate clusters for a user using Union-Find algorithm
CREATE OR REPLACE FUNCTION public.recalculate_note_clusters(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  relation RECORD;
  note_id uuid;
  parent_map jsonb := '{}'::jsonb;
  rank_map jsonb := '{}'::jsonb;
  cluster_assignments jsonb := '{}'::jsonb;
  root1 text;
  root2 text;
  current_cluster integer := 0;
  root_to_cluster jsonb := '{}'::jsonb;
BEGIN
  -- Reset all clusters for this user first
  UPDATE public.notes SET cluster_index = NULL WHERE user_id = p_user_id;
  
  -- Initialize parent map for all notes in relations
  FOR relation IN 
    SELECT source_note_id, target_note_id 
    FROM public.note_relations 
    WHERE user_id = p_user_id
  LOOP
    -- Initialize source if not exists
    IF NOT parent_map ? relation.source_note_id::text THEN
      parent_map := parent_map || jsonb_build_object(relation.source_note_id::text, relation.source_note_id::text);
      rank_map := rank_map || jsonb_build_object(relation.source_note_id::text, 0);
    END IF;
    
    -- Initialize target if not exists
    IF NOT parent_map ? relation.target_note_id::text THEN
      parent_map := parent_map || jsonb_build_object(relation.target_note_id::text, relation.target_note_id::text);
      rank_map := rank_map || jsonb_build_object(relation.target_note_id::text, 0);
    END IF;
  END LOOP;
  
  -- Union all related notes
  FOR relation IN 
    SELECT source_note_id, target_note_id 
    FROM public.note_relations 
    WHERE user_id = p_user_id
  LOOP
    -- Find root of source (with path compression simulation)
    root1 := relation.source_note_id::text;
    WHILE (parent_map->>root1) != root1 LOOP
      root1 := parent_map->>root1;
    END LOOP;
    
    -- Find root of target
    root2 := relation.target_note_id::text;
    WHILE (parent_map->>root2) != root2 LOOP
      root2 := parent_map->>root2;
    END LOOP;
    
    -- Union by rank
    IF root1 != root2 THEN
      IF (rank_map->>root1)::int < (rank_map->>root2)::int THEN
        parent_map := parent_map || jsonb_build_object(root1, root2);
      ELSIF (rank_map->>root1)::int > (rank_map->>root2)::int THEN
        parent_map := parent_map || jsonb_build_object(root2, root1);
      ELSE
        parent_map := parent_map || jsonb_build_object(root2, root1);
        rank_map := rank_map || jsonb_build_object(root1, ((rank_map->>root1)::int + 1)::text);
      END IF;
    END IF;
  END LOOP;
  
  -- Assign cluster indices based on roots
  FOR note_id IN SELECT jsonb_object_keys(parent_map)::uuid LOOP
    -- Find final root
    root1 := note_id::text;
    WHILE (parent_map->>root1) != root1 LOOP
      root1 := parent_map->>root1;
    END LOOP;
    
    -- Assign cluster index
    IF NOT root_to_cluster ? root1 THEN
      root_to_cluster := root_to_cluster || jsonb_build_object(root1, current_cluster);
      current_cluster := current_cluster + 1;
    END IF;
    
    -- Update the note
    UPDATE public.notes 
    SET cluster_index = (root_to_cluster->>root1)::int 
    WHERE id = note_id AND user_id = p_user_id;
  END LOOP;
END;
$$;

-- Trigger function to recalculate clusters on relation changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_clusters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_note_clusters(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_note_clusters(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on note_relations
DROP TRIGGER IF EXISTS recalculate_clusters_trigger ON public.note_relations;
CREATE TRIGGER recalculate_clusters_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.note_relations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalculate_clusters();