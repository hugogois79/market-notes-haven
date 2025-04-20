
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
      
      if (note.id.toString().startsWith('temp-')) {
        console.log("Creating new note with content:", note.content);
        const newNote = await createNote({
          title: note.title,
          content: note.content,
          tags: note.tags,
          category: note.category,
        });
        
        if (newNote) {
          console.log("New note created:", newNote.id);
          setNotes(prev => [newNote, ...prev]);
          refetch();
          return newNote;
        }
      } else {
        console.log("Updating note:", note.id);
        const updatedNote = await updateNote(note);
        
        if (updatedNote) {
          console.log("Note updated:", updatedNote.id);
          setNotes(prev => 
            prev.map(n => n.id === updatedNote.id ? updatedNote : n)
          );
          refetch();
          return updatedNote;
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
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
        refetch();
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
