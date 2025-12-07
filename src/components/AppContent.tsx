
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotesProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster />
          </BrowserRouter>
        </NotesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppContent;
