
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Note, Tag, Token } from "@/types";
import { getTokensForNote } from "@/services/tokenService";
import { fetchTags } from "@/services/supabaseService";

interface UseNoteDataProps {
  notes: Note[];
  onSaveNote: (note: Note) => Promise<Note | null>;
}

export const useNoteData = ({ notes, onSaveNote }: UseNoteDataProps) => {
  const { id } = useParams();
  const location = useLocation();
  const isNewNote = id === 'new' || location.pathname === '/editor/new';
  
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create empty note template for new notes
  const createEmptyNote = useCallback(() => {
    // Check for query parameters
    const queryParams = new URLSearchParams(location.search);
    const title = queryParams.get('title') || "Untitled Note";
    const category = queryParams.get('category') || "General";
    const tagString = queryParams.get('tags');
    const tags = tagString ? tagString.split(',') : [];
    
    return {
      id: `temp-${Date.now()}`,
      title,
      content: "",
      tags,
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, [location.search]);

  // Find the current note from the notes array or create a new one
  useEffect(() => {
    if (notes.length === 0) {
      return;
    }

    setIsLoading(true);
    
    if (isNewNote) {
      const emptyNote = createEmptyNote();
      setCurrentNote(emptyNote);
    } else if (id) {
      const foundNote = notes.find(note => note.id === id);
      setCurrentNote(foundNote || null);
    }
    
    setIsLoading(false);
  }, [notes, id, isNewNote, createEmptyNote]);

  // Load tokens linked to the current note
  useEffect(() => {
    const loadTokens = async () => {
      if (!currentNote || !currentNote.id || currentNote.id.toString().startsWith('temp-')) {
        setLinkedTokens([]);
        return;
      }

      try {
        const tokens = await getTokensForNote(currentNote.id);
        setLinkedTokens(tokens);
      } catch (error) {
        console.error("Error loading tokens:", error);
        setLinkedTokens([]);
      }
    };

    loadTokens();
  }, [currentNote]);

  // Load all available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading tags:", error);
        setAllTags([]);
      }
    };

    loadTags();
  }, []);

  // Get tags filtered by the specified category
  const getTagsFilteredByCategory = useCallback(
    (category: string | null) => {
      if (!category) return allTags;
      
      return allTags.filter(tag => {
        if (!tag.category && !tag.categories) return false;
        if (tag.category === category) return true;
        if (tag.categories && tag.categories.includes(category)) return true;
        return false;
      });
    },
    [allTags]
  );

  // Save note changes
  const handleSave = useCallback(
    async (updatedFields: Partial<Note>) => {
      if (!currentNote) return;

      const updatedNote = {
        ...currentNote,
        ...updatedFields,
        updatedAt: new Date()
      };

      try {
        const savedNote = await onSaveNote(updatedNote);
        if (savedNote) {
          setCurrentNote(savedNote);
        }
      } catch (error) {
        console.error("Error saving note:", error);
      }
    },
    [currentNote, onSaveNote]
  );

  return {
    currentNote,
    isNewNote,
    isLoading,
    linkedTokens,
    allTags,
    handleSave,
    getTagsFilteredByCategory
  };
};
