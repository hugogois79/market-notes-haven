
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRoutes from "@/routes/AppRoutes";

const AppContent = () => {
  return (
    <AuthProvider>
      <NotesProvider>
        <AppRoutes />
        <Toaster />
      </NotesProvider>
    </AuthProvider>
  );
};

export default AppContent;
