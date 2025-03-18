
import { Routes, Route } from "react-router-dom";
import { useNotes } from "@/contexts/NotesContext";
import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import Notes from "@/pages/Notes";
import Auth from "@/pages/Auth";
import Editor from "@/pages/Editor";
import Categories from "@/pages/Categories";
import Tags from "@/pages/Tags";
import TokensPage from "@/pages/tokens";
import TokenDetail from "@/pages/tokens/[id]";
import CryptoDashboard from "@/pages/crypto/Dashboard";
import Profile from "@/pages/Profile";

const AppRoutes = () => {
  const { notes, loading, isLoading, handleSaveNote, handleDeleteNote } = useNotes();

  // Function to wrap content with layout for authenticated pages
  const withLayout = (component: React.ReactNode) => (
    <MainLayout>{component}</MainLayout>
  );

  return (
    <Routes>
      <Route path="/" element={withLayout(<Index notes={notes} loading={loading || isLoading} />)} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            {withLayout(<Notes notes={notes} loading={loading || isLoading} />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/:noteId"
        element={
          <ProtectedRoute>
            {withLayout(
              <Editor 
                notes={notes} 
                onSaveNote={handleSaveNote} 
                onDeleteNote={handleDeleteNote} 
              />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            {withLayout(<Categories notes={notes} loading={loading || isLoading} />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <ProtectedRoute>
            {withLayout(<Tags notes={notes} loading={loading || isLoading} />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            {withLayout(<Settings />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/tokens"
        element={
          <ProtectedRoute>
            {withLayout(<TokensPage />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/tokens/:id"
        element={
          <ProtectedRoute>
            {withLayout(<TokenDetail />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/crypto/dashboard"
        element={
          <ProtectedRoute>
            {withLayout(<CryptoDashboard />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            {withLayout(<Profile />)}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
