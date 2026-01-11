import { getClusterColorByIndex } from '@/utils/noteRelationClusters';

// Simple hook that reads cluster_index directly from notes
// The cluster_index is pre-computed by database triggers when relations change
export const useNoteRelationClusters = () => {
  // Function to get cluster color for a specific note based on its cluster_index
  const getClusterColorForNote = (noteId: string, clusterIndex: number | null | undefined) => {
    return getClusterColorByIndex(clusterIndex);
  };

  return {
    getClusterColorForNote,
  };
};
