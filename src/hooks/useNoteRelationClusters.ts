import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildRelationClusters, getClusterColor } from '@/utils/noteRelationClusters';

interface NoteRelation {
  source_note_id: string;
  target_note_id: string;
}

export const useNoteRelationClusters = () => {
  // Fetch all relations for the current user
  const { data: relations = [], isLoading } = useQuery({
    queryKey: ['all-note-relations-for-clusters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('note_relations')
        .select('source_note_id, target_note_id');
      
      if (error) {
        console.error('Error fetching note relations:', error);
        return [];
      }
      
      return data as NoteRelation[];
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Build clusters from relations
  const clusterMap = useMemo(() => {
    return buildRelationClusters(relations);
  }, [relations]);

  // Function to get cluster color for a specific note
  const getClusterColorForNote = (noteId: string) => {
    return getClusterColor(noteId, clusterMap);
  };

  return {
    clusterMap,
    getClusterColorForNote,
    isLoading,
    hasRelations: relations.length > 0,
  };
};
