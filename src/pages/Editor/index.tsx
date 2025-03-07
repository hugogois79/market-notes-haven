
import React, { useState } from "react";
import { Note } from "@/types";
import NoteActions from "./NoteActions";
import NoteEditor from "./NoteEditor";
import { useNoteData } from "./hooks/useNoteData";

interface EditorProps {
  notes: Note[];
  onSaveNote: (note: Note) => Promise<Note | null>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
}

const Editor = ({ notes, onSaveNote, onDeleteNote }: EditorProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    currentNote,
    isNewNote,
    linkedTokens,
    allTags,
    handleSave
  } = useNoteData({ notes, onSaveNote });

  // Handle deleting the note with loading state
  const handleDeleteWithLoading = async (noteId: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const result = await onDeleteNote(noteId);
      return result;
    } finally {
      setIsDeleting(false);
    }
  };

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
        isNewNote={isNewNote}
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
        />
      )}
    </div>
  );
};

export default Editor;
