
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Note, Token, Tag } from "@/types";
import { getTokensForNote } from "@/services/tokenService";
import { fetchTags, getTagsForNote } from "@/services/tagService";
import { useParams, useNavigate } from "react-router-dom";

interface UseNoteDataProps {
  notes: Note[];
  onSaveNote: (note: Note) => Promise<Note | null>;
}

export const useNoteData = ({ notes, onSaveNote }: UseNoteDataProps) => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [currentNote, setCurrentNote] = useState<Note | undefined>(undefined);
  const [isNewNote, setIsNewNote] = useState(false);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Effect to load tokens and tags
  useEffect(() => {
    const loadTokensAndTags = async () => {
      setIsLoadingTags(true);
      
      try {
        // Fetch tags
        const tags = await fetchTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading tags:", error);
      } finally {
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
        console.log('Loaded note category:', foundNote.category);
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
        
        // Fetch linked tags if the ID is not a temp ID
        if (!foundNote.id.startsWith('temp-')) {
          const fetchTagsForNote = async () => {
            try {
              setIsLoadingTags(true);
              const noteTags = await getTagsForNote(foundNote.id);
              
              // Update the foundNote.tags to match what's in the database
              if (noteTags.length > 0) {
                foundNote.tags = noteTags.map(tag => tag.id);
                setCurrentNote({...foundNote});
              }
            } catch (error) {
              console.error("Error fetching tags for note:", error);
            } finally {
              setIsLoadingTags(false);
            }
          };
          
          fetchTagsForNote();
        }
      } else {
        // Note not found, redirect to notes list
        toast.error("Note not found");
        navigate("/notes");
      }
    }
    // If notes hasn't loaded yet, we'll wait for the next render when notes are available
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
    
    // If the title is included, update the current note immediately to reflect in UI
    if (updatedFields.title !== undefined) {
      setCurrentNote(prevNote => {
        if (!prevNote) return updatedNote;
        return { ...prevNote, title: updatedFields.title || "" };
      });
    }
    
    // If the category is included, update the current note immediately
    if (updatedFields.category !== undefined) {
      setCurrentNote(prevNote => {
        if (!prevNote) return updatedNote;
        return { ...prevNote, category: updatedFields.category || "General" };
      });
    }
    
    // If tags are included, update the current note immediately
    if (updatedFields.tags !== undefined) {
      setCurrentNote(prevNote => {
        if (!prevNote) return updatedNote;
        return { ...prevNote, tags: updatedFields.tags || [] };
      });
    }
    
    const savedNote = await onSaveNote(updatedNote);
    
    if (savedNote) {
      console.log('Note saved successfully');
      console.log('Saved category:', savedNote.category);
      
      if (isNewNote) {
        // Redirect to the new note's edit page
        navigate(`/editor/${savedNote.id}`, { replace: true });
        setIsNewNote(false);
      }
      
      setCurrentNote(savedNote);
      
      // No need to show toast here as it will be handled by the caller
    } else {
      console.error('Failed to save note');
      toast.error("Failed to save note");
    }
  };

  return {
    currentNote,
    isNewNote,
    linkedTokens,
    allTags,
    isLoadingTags,
    isLoadingTokens,
    handleSave
  };
};
