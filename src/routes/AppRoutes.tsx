
import React, { useEffect } from "react";
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
  // We can get notes and loading state from context, but we don't need to pass them as props anymore
  // Each component will use the useNotes() hook directly to access this data
  const { handleSaveNote, handleDeleteNote } = useNotes();

  useEffect(() => {
    console.log("AppRoutes mounted");
  }, []);

  // Function to wrap content with layout for authenticated pages
  const withLayout = (component: React.ReactNode) => (
    <MainLayout>{component}</MainLayout>
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {withLayout(<Index />)}
          </ProtectedRoute>
        }
      />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            {withLayout(<Notes />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/:noteId"
        element={
          <ProtectedRoute>
            {withLayout(
              <Editor 
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
            {withLayout(<Categories />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <ProtectedRoute>
            {withLayout(<Tags />)}
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
