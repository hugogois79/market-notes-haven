import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import AIAssistant from "@/components/AIAssistant";
import KeyboardShortcutsProvider from "@/components/KeyboardShortcutsProvider";

const AppContent = () => {
  return (
    <AuthProvider>
      <NotesProvider>
        <BrowserRouter>
          <KeyboardShortcutsProvider>
            <AppRoutes />
            <AIAssistant />
            <Toaster />
          </KeyboardShortcutsProvider>
        </BrowserRouter>
      </NotesProvider>
    </AuthProvider>
  );
};

export default AppContent;
