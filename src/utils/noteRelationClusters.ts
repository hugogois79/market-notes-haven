// Cluster colors palette - soft backgrounds for light and dark modes
export const clusterColors = [
  { bg: 'bg-blue-50', darkBg: 'dark:bg-blue-950/30' },
  { bg: 'bg-green-50', darkBg: 'dark:bg-green-950/30' },
  { bg: 'bg-purple-50', darkBg: 'dark:bg-purple-950/30' },
  { bg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/30' },
  { bg: 'bg-rose-50', darkBg: 'dark:bg-rose-950/30' },
  { bg: 'bg-cyan-50', darkBg: 'dark:bg-cyan-950/30' },
  { bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-950/30' },
  { bg: 'bg-teal-50', darkBg: 'dark:bg-teal-950/30' },
];

interface NoteRelation {
  source_note_id: string;
  target_note_id: string;
}

// Union-Find data structure for clustering
class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return;
    
    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;
    
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }
}

/**
 * Build clusters from note relations using Union-Find algorithm
 * Returns a Map of noteId -> clusterIndex
 */
export function buildRelationClusters(relations: NoteRelation[]): Map<string, number> {
  if (!relations || relations.length === 0) {
    return new Map();
  }

  const uf = new UnionFind();
  
  // Union all related notes
  for (const relation of relations) {
    uf.union(relation.source_note_id, relation.target_note_id);
  }
  
  // Collect all note IDs that have relations
  const noteIds = new Set<string>();
  for (const relation of relations) {
    noteIds.add(relation.source_note_id);
    noteIds.add(relation.target_note_id);
  }
  
  // Group notes by their root (cluster leader)
  const rootToNotes = new Map<string, string[]>();
  for (const noteId of noteIds) {
    const root = uf.find(noteId);
    if (!rootToNotes.has(root)) {
      rootToNotes.set(root, []);
    }
    rootToNotes.get(root)!.push(noteId);
  }
  
  // Assign cluster indices
  const clusterMap = new Map<string, number>();
  let clusterIndex = 0;
  
  for (const notes of rootToNotes.values()) {
    for (const noteId of notes) {
      clusterMap.set(noteId, clusterIndex);
    }
    clusterIndex++;
  }
  
  return clusterMap;
}

/**
 * Get the color for a note based on its cluster
 * Returns null if the note has no relations
 */
export function getClusterColor(
  noteId: string, 
  clusterMap: Map<string, number>
): { bg: string; darkBg: string } | null {
  if (!clusterMap.has(noteId)) {
    return null;
  }
  
  const clusterIndex = clusterMap.get(noteId)!;
  const colorIndex = clusterIndex % clusterColors.length;
  
  return clusterColors[colorIndex];
}
