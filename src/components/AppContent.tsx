
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import AppRoutes from "@/routes/AppRoutes";

const AppContent = () => {
  return (
    <NotesProvider>
      <AppRoutes />
      <Toaster />
    </NotesProvider>
  );
};

export default AppContent;
