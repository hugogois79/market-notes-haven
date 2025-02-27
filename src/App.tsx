
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import Settings from "./pages/Settings";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import MainLayout from "./layouts/MainLayout";
import { useState, useEffect } from "react";
import { Note } from "./types";
import { fetchNotes, updateNote, createNote, deleteNote } from "./services/supabaseService";
import { toast } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from Supabase on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const fetchedNotes = await fetchNotes();
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error loading notes:", error);
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Handle saving a note
  const handleSaveNote = async (note: Note) => {
    try {
      let savedNote: Note | null;
      
      if (notes.some((n) => n.id === note.id)) {
        // Update existing note
        savedNote = await updateNote(note);
        if (savedNote) {
          setNotes((prevNotes) => 
            prevNotes.map((n) => (n.id === savedNote?.id ? savedNote : n))
          );
          toast.success("Note updated successfully");
        }
      } else {
        // Create new note
        savedNote = await createNote({
          title: note.title,
          content: note.content,
          tags: note.tags,
          category: note.category,
        });
        
        if (savedNote) {
          setNotes((prevNotes) => [...prevNotes, savedNote as Note]);
          toast.success("Note created successfully");
        }
      }
      
      if (!savedNote) {
        toast.error("Failed to save note");
      }
      
      return savedNote;
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
      return null;
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const success = await deleteNote(noteId);
      
      if (success) {
        setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
        toast.success("Note deleted successfully");
      } else {
        toast.error("Failed to delete note");
      }
      
      return success;
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
      return false;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" expand={false} closeButton theme="light" />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Index notes={notes} loading={loading} />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/notes" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Notes notes={notes} loading={loading} />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/editor/:noteId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Editor 
                      notes={notes} 
                      onSaveNote={handleSaveNote}
                      onDeleteNote={handleDeleteNote}
                    />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
