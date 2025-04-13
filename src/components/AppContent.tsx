
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import AppRoutes from "@/routes/AppRoutes";
import InstallPWA from "@/components/InstallPWA";
import FloatingInstallPrompt from "@/components/pwa/FloatingInstallPrompt";
import ProtocolHandler from "@/components/pwa/ProtocolHandler";

const AppContent = () => {
  return (
    <>
      <ProtocolHandler />
      <NotesProvider>
        <AppRoutes />
        <Toaster />
        <InstallPWA />
        <FloatingInstallPrompt />
      </NotesProvider>
    </>
  );
};

export default AppContent;
