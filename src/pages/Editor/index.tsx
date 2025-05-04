import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Note } from "@/types";
import NoteActions from "./NoteActions";
import NoteEditor from "./NoteEditor";
import { useNoteData } from "./hooks/useNoteData";
import { useNotes } from "@/contexts/NotesContext";
import { toast } from "sonner";

interface EditorProps {
  onSaveNote: (note: Note) => Promise<Note | null>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
}

const Editor = ({ onSaveNote, onDeleteNote }: EditorProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { notes, handleSaveNote, handleDeleteNote, refetch } = useNotes();
  const isNewNote = id === 'new' || location.pathname === '/editor/new';
  
  const {
    currentNote,
    isNewNote: isNewFromHook,
    linkedTokens,
    allTags,
    handleSave,
    getTagsFilteredByCategory
  } = useNoteData({ notes, onSaveNote: handleSaveNote || onSaveNote });

  // Handle creating a new note from URL params
  useEffect(() => {
    if (isNewNote && !currentNote) {
      console.log("Creating new note from URL params");
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
        attachments: [] // Initialize with empty attachments array
      };
      
      // Create and navigate to the new note
      const saveFunction = handleSaveNote || onSaveNote;
      saveFunction(newNote).then(savedNote => {
        if (savedNote) {
          console.log("New note created with ID:", savedNote.id);
          // Navigate directly to the editor path with the new ID
          navigate(`/editor/${savedNote.id}`, { replace: true });
          // Explicitly refetch notes to update the list
          if (refetch) refetch();
        } else {
          console.error("Failed to create new note");
          toast.error("Failed to create new note");
        }
      }).catch(error => {
        console.error("Error creating note:", error);
        toast.error("Error creating note: " + (error.message || "Unknown error"));
      });
    }
  }, [isNewNote, currentNote, location.search, onSaveNote, handleSaveNote, navigate, refetch]);

  // Check if note exists
  useEffect(() => {
    if (!isNewNote && notes.length > 0 && id) {
      const noteExists = notes.some(note => note.id === id);
      setNotFound(!noteExists);
      
      if (!noteExists) {
        console.error("Note not found with ID:", id);
        toast.error("Note not found");
      }
    }
  }, [notes, id, isNewNote]);

  // Enhanced save handler that ensures refetch after save
  const handleEnhancedSave = async (updatedFields: Partial<Note>) => {
    try {
      const result = await handleSave(updatedFields);
      // Explicitly refetch notes to update the list
      if (refetch) {
        console.log("Refetching notes after save");
        refetch();
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
      const deleteFunction = handleDeleteNote || onDeleteNote;
      const result = await deleteFunction(noteId);
      if (result) {
        navigate('/notes');
        toast.success("Note deleted successfully");
        // Explicitly refetch notes to update the list
        if (refetch) refetch();
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
          currentNote={currentNote || {
            id: `temp-${Date.now()}`,
            title: "Untitled Note",
            content: "",
            tags: [],
            category: "General",
            createdAt: new Date(),
            updatedAt: new Date(),
            attachments: [] // Initialize with empty attachments array
          }}
          onSave={handleEnhancedSave}
          linkedTokens={linkedTokens}
          allTags={allTags}
          getTagsFilteredByCategory={getTagsFilteredByCategory}
        />
      )}
    </div>
  );
};

export default Editor;
