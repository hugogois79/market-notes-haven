
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";
import { useState, useEffect } from "react";
import { Note } from "./types";
import { loadNotes, saveNotes } from "./utils/noteUtils";

const queryClient = new QueryClient();

const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  // Load notes from localStorage on mount
  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  // Save notes to localStorage when they change
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Handle saving a note
  const handleSaveNote = (note: Note) => {
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((n) => n.id === note.id);
      if (noteIndex >= 0) {
        // Update existing note
        const updatedNotes = [...prevNotes];
        updatedNotes[noteIndex] = note;
        return updatedNotes;
      } else {
        // Add new note
        return [...prevNotes, note];
      }
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" expand={false} closeButton theme="light" />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Index notes={notes} />} />
              <Route path="/editor/:noteId" element={<Editor notes={notes} onSaveNote={handleSaveNote} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
