
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { NotesProvider } from "@/contexts/NotesContext";
import AppRoutes from "@/routes/AppRoutes";

const AppContent = () => {
  return (
    <NotesProvider>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </NotesProvider>
  );
};

export default AppContent;
