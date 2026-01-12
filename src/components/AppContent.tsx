import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import AIAssistant from "@/components/AIAssistant";
import KeyboardShortcutsProvider from "@/components/KeyboardShortcutsProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

const AppContent = () => {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default AppContent;
