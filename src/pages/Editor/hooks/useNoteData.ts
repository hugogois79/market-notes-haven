import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Note, Token, Tag } from "@/types";
import { getTokensForNote } from "@/services/tokenService";
import { fetchTags, getTagsForNote } from "@/services/tag";
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

  useEffect(() => {
    const loadTokensAndTags = async () => {
      setIsLoadingTags(true);
      
      try {
        const tags = await fetchTags();
        console.log("Loaded tags:", tags);
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading tags:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };
    
    loadTokensAndTags();
  }, []);

  useEffect(() => {
    console.log("Editor: noteId =", noteId);
    console.log("Notes available:", notes.length);
    
    if (noteId === "new") {
      console.log("Setting up new note");
      setIsNewNote(true);
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
        
        const fetchLinkedTokens = async () => {
          try {
            setIsLoadingTokens(true);
            const tokens = await getTokensForNote(foundNote.id);
            console.log("Fetched linked tokens:", tokens);
            setLinkedTokens(tokens);
          } catch (error) {
            console.error("Error fetching linked tokens:", error);
          } finally {
            setIsLoadingTokens(false);
          }
        };
        
        fetchLinkedTokens();
        
        if (!foundNote.id.startsWith('temp-')) {
          const fetchTagsForNote = async () => {
            try {
              setIsLoadingTags(true);
              const noteTags = await getTagsForNote(foundNote.id);
              console.log("Fetched tags for note:", noteTags);
              
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
        toast.error("Note not found");
        navigate("/notes");
      }
    }
  }, [noteId, notes, navigate]);

  const handleSave = async (updatedFields: Partial<Note>): Promise<void> => {
    if (!currentNote) return;
    
    console.log('Updating note with fields:', updatedFields);
    
    const updatedNote: Note = {
      ...currentNote,
      ...updatedFields,
      updatedAt: new Date()
    };
    
    if (updatedFields.tokens) {
      setLinkedTokens(updatedFields.tokens);
      console.log('Setting linked tokens:', updatedFields.tokens);
    }
    
    if (updatedFields.title !== undefined) {
      setCurrentNote(prevNote => {
        if (!prevNote) return updatedNote;
        return { ...prevNote, title: updatedFields.title || "" };
      });
    }
    
    if (updatedFields.category !== undefined) {
      setCurrentNote(prevNote => {
        if (!prevNote) return updatedNote;
        return { ...prevNote, category: updatedFields.category || "General" };
      });
    }
    
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
        navigate(`/editor/${savedNote.id}`, { replace: true });
        setIsNewNote(false);
      }
      
      setCurrentNote(savedNote);
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
