
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Note } from "@/types";
import NoteActions from "./NoteActions";
import NoteEditor from "./NoteEditor";
import { useNoteData } from "./hooks/useNoteData";
import { useNotes } from "@/contexts/NotesContext";
import { toast } from "sonner";

const Editor = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [hasCreatedNote, setHasCreatedNote] = useState(false);
  const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);
  const tempNoteRef = useRef<Note | null>(null);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { notes, handleSaveNote, handleDeleteNote, refetch, isLoading } = useNotes();
  const isNewNote = id === 'new' || location.pathname === '/editor/new';
  
  const {
    currentNote,
    isNewNote: isNewFromHook,
    linkedTokens,
    allTags,
    handleSave,
    getTagsFilteredByCategory
  } = useNoteData({ notes, onSaveNote: handleSaveNote });

  // Handle creating a new note from URL params - FIXED to prevent duplicate creations
  useEffect(() => {
    if (isNewNote && !currentNote && !hasCreatedNote && notes.length > 0) {
      console.log("Creating new note from URL params");
      setHasCreatedNote(true);
      
      // Check for query parameters to pre-fill the note
      const queryParams = new URLSearchParams(location.search);
      const title = queryParams.get('title') || "Untitled Note";
      const category = queryParams.get('category') || "General";
      const tags = queryParams.get('tags')?.split(',') || [];
      
      const newNote: Note = {
        id: `temp-${Date.now()}`,
        title,
        content: "",
        tags,
        category,
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: []
      };
      
      // Create and navigate to the new note
      handleSaveNote(newNote).then(savedNote => {
        if (savedNote) {
          console.log("New note created with ID:", savedNote.id);
          // Set pending note ID BEFORE navigating to prevent "Note Not Found"
          setPendingNoteId(savedNote.id);
          // Navigate directly to the editor path with the new ID
          navigate(`/editor/${savedNote.id}`, { replace: true });
          // Clear pending after a short delay
          setTimeout(() => setPendingNoteId(null), 500);
        } else {
          console.error("Failed to create new note");
          toast.error("Failed to create new note");
          setHasCreatedNote(false);
        }
      }).catch(error => {
        console.error("Error creating note:", error);
        toast.error("Error creating note: " + (error.message || "Unknown error"));
        setHasCreatedNote(false);
      });
    }
  }, [isNewNote, currentNote, location.search, handleSaveNote, navigate, refetch, hasCreatedNote, notes.length]);

  // Reset hasCreatedNote when navigating away from new note route
  useEffect(() => {
    if (!isNewNote) {
      setHasCreatedNote(false);
    }
  }, [isNewNote]);

  // Check if note exists - with grace period for newly created notes
  useEffect(() => {
    // Don't check while loading or if this is the pending note we just created
    if (isLoading || pendingNoteId === id) {
      setNotFound(false);
      return;
    }
    
    if (!isNewNote && notes.length > 0 && id) {
      const noteExists = notes.some(note => note.id === id);
      
      // Only set notFound if the note truly doesn't exist after cache is populated
      if (!noteExists) {
        // Add a small delay before showing "not found" to allow cache update
        const timer = setTimeout(() => {
          const stillMissing = !notes.some(note => note.id === id);
          if (stillMissing) {
            setNotFound(true);
            console.error("Note not found with ID:", id);
            toast.error("Note not found");
          }
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setNotFound(false);
      }
    }
  }, [notes, id, isNewNote, isLoading, pendingNoteId]);

  // Enhanced save handler that ensures refetch after save and properly handles title changes
  const handleEnhancedSave = async (updatedFields: Partial<Note>) => {
    try {
      console.log("Enhanced save called with fields:", updatedFields);
      
      // Make sure we immediately save title changes
      if (updatedFields.title !== undefined) {
        console.log("CRITICAL: Title change detected, saving immediately:", updatedFields.title);
      }
      
      const result = await handleSave(updatedFields);
      // Always refetch notes to update the list
      if (refetch) {
        console.log("Refetching notes after save");
        await refetch();
      }
      return result;
    } catch (error) {
      console.error("Error in enhanced save:", error);
      throw error;
    }
  };

  // Handle deleting the note with loading state
  const handleDeleteWithLoading = async (noteId: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const result = await handleDeleteNote(noteId);
      if (result) {
        navigate('/notes');
        toast.success("Note deleted successfully");
        // Explicitly refetch notes to update the list
        if (refetch) await refetch();
      }
      return result;
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Show not found state
  if (notFound) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Note Not Found</h2>
          <p className="text-muted-foreground mb-6">The note you're looking for doesn't exist or has been deleted.</p>
          <button 
            onClick={() => navigate('/notes')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  // Show a loading state if we're still waiting for notes to load
  if (!currentNote && notes.length === 0 && !isNewNote) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Actions */}
      <NoteActions 
        currentNote={currentNote} 
        isNewNote={isNewNote || isNewFromHook}
        isDeleting={isDeleting}
        onDeleteNote={handleDeleteWithLoading}
      />
      
      {/* Editor */}
      {(currentNote || isNewNote) && (
        <NoteEditor 
          currentNote={currentNote || (() => {
            // Use stable temp note reference to avoid creating new IDs on every render
            if (!tempNoteRef.current) {
              tempNoteRef.current = {
                id: `temp-${Date.now()}`,
                title: "Untitled Note",
                content: "",
                tags: [],
                category: "General",
                createdAt: new Date(),
                updatedAt: new Date(),
                attachments: []
              };
            }
            return tempNoteRef.current;
          })()}
          onSave={handleEnhancedSave}
          linkedTokens={linkedTokens}
          allTags={allTags}
          getTagsFilteredByCategory={getTagsFilteredByCategory}
          onDelete={() => currentNote && handleDeleteWithLoading(currentNote.id)}
          isDeleting={isDeleting}
          canDelete={currentNote && !isNewNote && !currentNote.id.toString().startsWith("temp-")}
        />
      )}
    </div>
  );
};

export default Editor;
