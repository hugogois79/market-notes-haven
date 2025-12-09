import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/types';

interface SemanticSearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  summary: string;
  created_at: string;
  updated_at: string;
  similarity: number;
}

export function useSemanticSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);

  const semanticSearch = useCallback(async (query: string): Promise<Note[]> => {
    if (!query.trim()) {
      setSearchResults(null);
      return [];
    }

    setIsSearching(true);

    try {
      // Generate embedding for the search query using the embed-note edge function
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('embed-note', {
        body: { title: query, content: '' }
      });

      if (embeddingError) {
        console.error('Error generating embedding for search:', embeddingError);
        throw embeddingError;
      }

      if (!embeddingData?.embedding) {
        console.error('No embedding returned for search query');
        return [];
      }

      // Call the match_notes RPC function with the embedding
      const { data: matchedNotes, error: matchError } = await supabase.rpc('match_notes', {
        query_embedding: embeddingData.embedding,
        match_threshold: 0.5,
        match_count: 20
      });

      if (matchError) {
        console.error('Error matching notes:', matchError);
        throw matchError;
      }

      // Transform the results to Note type
      const notes: Note[] = (matchedNotes as SemanticSearchResult[] || []).map(result => ({
        id: result.id,
        title: result.title || '',
        content: result.content || '',
        category: result.category || 'General',
        summary: result.summary || '',
        tags: [],
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at),
        attachmentUrl: undefined,
        attachments: [],
        tradeInfo: undefined,
        hasConclusion: false,
      }));

      setSearchResults(notes);
      return notes;
    } catch (error) {
      console.error('Semantic search error:', error);
      setSearchResults(null);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
  }, []);

  return {
    isSearching,
    searchResults,
    semanticSearch,
    clearSearch
  };
}
