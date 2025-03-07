
import { useState, useEffect } from 'react';
import { Note, Token, Tag } from '@/types';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getTokensForNote } from '@/services/tokenService';
import { fetchTags } from '@/services/tagService';

interface UseNoteDataProps {
  notes: Note[];
  onSaveNote: (note: Note) => Promise<Note | null>;
}

export const useNoteData = ({ notes, onSaveNote }: UseNoteDataProps) => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [currentNote, setCurrentNote] = useState<Note | undefined>(undefined);
  const [isNewNote, setIsNewNote] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  
  // Effect to fetch all unique categories from notes
  useEffect(() => {
    if (notes.length > 0) {
      const uniqueCategories = Array.from(
        new Set(
          notes
            .map(note => note.category)
            .filter(category => category) // Filter out null/undefined
        )
      );
      
      setCategories(uniqueCategories as string[]);
    }
  }, [notes]);

  // Effect to load tokens and tags
  useEffect(() => {
    const loadTokensAndTags = async () => {
      setIsLoadingTokens(true);
      setIsLoadingTags(true);
      
      try {
        // Fetch tokens
        const tokens = await getTokensForNote('all');
        setAllTokens(tokens);
        
        // Fetch tags
        const tags = await fetchTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading tokens and tags:", error);
      } finally {
        setIsLoadingTokens(false);
        setIsLoadingTags(false);
      }
    };
    
    loadTokensAndTags();
  }, []);

  // Effect to load the note or set up a new one
  useEffect(() => {
    console.log("Editor: noteId =", noteId);
    console.log("Notes available:", notes.length);
    
    if (noteId === "new") {
      console.log("Setting up new note");
      setIsNewNote(true);
      // Create a placeholder new note object with default values
      const newNoteTemplate: Note = {
        id: "temp-" + Date.now().toString(),
        title: "Untitled Note",
        content: "",
        summary: "",
        tags: [],
        category: "General",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setCurrentNote(newNoteTemplate);
      setLinkedTokens([]);
    } else if (notes.length > 0) {
      const foundNote = notes.find(note => note.id === noteId);
      console.log("Found note:", foundNote);
      
      if (foundNote) {
        console.log('Loaded note content:', foundNote.content);
        setCurrentNote(foundNote);
        setIsNewNote(false);
        
        // Fetch linked tokens for this note
        const fetchLinkedTokens = async () => {
          try {
            setIsLoadingTokens(true);
            const tokens = await getTokensForNote(foundNote.id);
            setLinkedTokens(tokens);
          } catch (error) {
            console.error("Error fetching linked tokens:", error);
          } finally {
            setIsLoadingTokens(false);
          }
        };
        
        fetchLinkedTokens();
      } else {
        // Note not found, redirect to notes list
        toast.error("Note not found");
        navigate("/notes");
      }
    }
  }, [noteId, notes, navigate]);

  // Handle saving the note
  const handleSave = async (updatedFields: Partial<Note>): Promise<void> => {
    if (!currentNote) return;
    
    console.log('Updating note with fields:', updatedFields);
    
    // Merge the updated fields with the current note
    const updatedNote: Note = {
      ...currentNote,
      ...updatedFields,
      updatedAt: new Date()
    };
    
    // Only update tokens if they were changed
    if (updatedFields.tokens) {
      setLinkedTokens(updatedFields.tokens);
    }
    
    const savedNote = await onSaveNote(updatedNote);
    
    if (savedNote) {
      console.log('Note saved successfully');
      
      if (isNewNote) {
        // Redirect to the new note's edit page
        navigate(`/editor/${savedNote.id}`, { replace: true });
        setIsNewNote(false);
      }
      
      setCurrentNote(savedNote);
      toast.success("Note saved successfully");
    } else {
      console.error('Failed to save note');
      toast.error("Failed to save note");
    }
  };

  return {
    currentNote,
    isNewNote,
    categories,
    linkedTokens,
    allTokens,
    allTags,
    isLoadingTokens,
    isLoadingTags,
    handleSave
  };
};
