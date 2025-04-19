
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
  const { notes } = useNotes();
  const isNewNote = id === 'new' || location.pathname === '/editor/new';
  
  const {
    currentNote,
    isNewNote: isNewFromHook,
    linkedTokens,
    allTags,
    handleSave,
    getTagsFilteredByCategory
  } = useNoteData({ notes, onSaveNote });

  // Handle creating a new note from URL params
  useEffect(() => {
    if (isNewNote && !currentNote) {
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
        updatedAt: new Date()
      };
      
      // Create and navigate to the new note
      onSaveNote(newNote).then(savedNote => {
        if (savedNote) {
          navigate(`/notes/${savedNote.id}`, { replace: true });
          toast.success("New note created");
        }
      });
    }
  }, [isNewNote, currentNote, location.search, onSaveNote, navigate]);

  // Check if note exists
  useEffect(() => {
    if (!isNewNote && notes.length > 0 && id) {
      const noteExists = notes.some(note => note.id === id);
      setNotFound(!noteExists);
      
      if (!noteExists) {
        toast.error("Note not found");
      }
    }
  }, [notes, id, isNewNote]);

  // Handle deleting the note with loading state
  const handleDeleteWithLoading = async (noteId: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const result = await onDeleteNote(noteId);
      if (result) {
        navigate('/notes');
        toast.success("Note deleted successfully");
      }
      return result;
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
  if (!currentNote && notes.length === 0) {
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
      {currentNote && (
        <NoteEditor 
          currentNote={currentNote}
          onSave={handleSave}
          linkedTokens={linkedTokens}
          allTags={allTags}
          getTagsFilteredByCategory={getTagsFilteredByCategory}
        />
      )}
    </div>
  );
};

export default Editor;
