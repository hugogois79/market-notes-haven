
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";

const AppContent = () => {
  return (
    <AuthProvider>
      <NotesProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </NotesProvider>
    </AuthProvider>
  );
};

export default AppContent;
