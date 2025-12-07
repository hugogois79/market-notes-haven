import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotesProvider } from "@/contexts/NotesContext";
import { Toaster } from "@/components/ui/sonner";
import AppRoutes from "@/routes/AppRoutes";

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
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
  </React.StrictMode>
);
