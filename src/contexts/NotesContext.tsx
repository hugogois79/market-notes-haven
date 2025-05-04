
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNotes, createNote, updateNote, deleteNote } from "@/services/supabaseService";
import { Note } from "@/types";

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  isLoading: boolean;
  handleSaveNote: (note: Note) => Promise<Note | null>;
  handleDeleteNote: (noteId: string) => Promise<boolean>;
  refetch: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider = ({ children }: NotesProviderProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: notesData, isLoading, refetch } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  useEffect(() => {
    if (notesData) {
      console.log("Fetched notes:", notesData.length);
      setNotes(notesData);
      setLoading(false);
    }
  }, [notesData]);

  const handleSaveNote = async (note: Note) => {
    try {
      console.log("Saving note:", note);
      
      // Ensure attachments is always an array
      const noteWithValidAttachments = {
        ...note,
        attachments: Array.isArray(note.attachments) ? note.attachments : []
      };
      
      if (note.id.toString().startsWith('temp-')) {
        console.log("Creating new note with content:", noteWithValidAttachments.content);
        const newNote = await createNote({
          title: noteWithValidAttachments.title,
          content: noteWithValidAttachments.content,
          tags: noteWithValidAttachments.tags,
          category: noteWithValidAttachments.category,
          attachments: noteWithValidAttachments.attachments,
          hasConclusion: noteWithValidAttachments.hasConclusion
        });
        
        if (newNote) {
          console.log("New note created:", newNote.id);
          setNotes(prev => [newNote, ...prev]);
          await refetch();
          return newNote;
        }
      } else {
        console.log("Updating note:", noteWithValidAttachments.id);
        const updatedNote = await updateNote(noteWithValidAttachments);
        
        if (updatedNote) {
          console.log("Note updated:", updatedNote.id);
          setNotes(prev => 
            prev.map(n => n.id === updatedNote.id ? updatedNote : n)
          );
          await refetch();
          return updatedNote;
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
    return null;
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      console.log("Deleting note:", noteId);
      const success = await deleteNote(noteId);
      
      if (success) {
        console.log("Note deleted successfully");
        setNotes(prev => prev.filter(note => note.id !== noteId));
        await refetch();
        return true;
      }
      
      return success;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  };

  return (
    <NotesContext.Provider 
      value={{ 
        notes, 
        loading, 
        isLoading, 
        handleSaveNote, 
        handleDeleteNote,
        refetch
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
