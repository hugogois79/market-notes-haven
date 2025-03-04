
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Notes from "./pages/Notes";
import Auth from "./pages/Auth";
import Editor from "./pages/Editor";
import Categories from "./pages/Categories";
import TokensPage from "./pages/tokens";
import TokenDetail from "./pages/tokens/[id]";
import CryptoDashboard from "./pages/crypto/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { fetchNotes, createNote, updateNote, deleteNote } from "./services/supabaseService";
import { Note } from "./types";

import "./App.css";

// Create a client
const queryClient = new QueryClient();

function AppContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notes using react-query
  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  // Update local state when query data changes
  useEffect(() => {
    if (notesData) {
      setNotes(notesData);
      setLoading(false);
    }
  }, [notesData]);

  // Handle save note (create or update)
  const handleSaveNote = async (note: Note) => {
    if (!note.id || note.id === "new") {
      // Create new note
      const newNote = await createNote({
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category,
      });
      
      if (newNote) {
        setNotes(prev => [newNote, ...prev]);
        return newNote;
      }
    } else {
      // Update existing note
      const updatedNote = await updateNote(note);
      
      if (updatedNote) {
        setNotes(prev => 
          prev.map(n => n.id === updatedNote.id ? updatedNote : n)
        );
        return updatedNote;
      }
    }
    return null;
  };

  // Handle delete note
  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    
    if (success) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
    
    return success;
  };

  // Function to wrap content with layout for authenticated pages
  const withLayout = (component: React.ReactNode) => (
    <MainLayout>{component}</MainLayout>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={withLayout(<Index notes={notes} loading={loading || isLoading} />)} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              {withLayout(<Notes notes={notes} loading={loading || isLoading} />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:id?"
          element={
            <ProtectedRoute>
              {withLayout(
                <Editor 
                  notes={notes} 
                  onSaveNote={handleSaveNote} 
                  onDeleteNote={handleDeleteNote} 
                />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              {withLayout(<Categories notes={notes} loading={loading || isLoading} />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              {withLayout(<Settings />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/tokens"
          element={
            <ProtectedRoute>
              {withLayout(<TokensPage />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/tokens/:id"
          element={
            <ProtectedRoute>
              {withLayout(<TokenDetail />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/crypto/dashboard"
          element={
            <ProtectedRoute>
              {withLayout(<CryptoDashboard />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {withLayout(<Profile />)}
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
