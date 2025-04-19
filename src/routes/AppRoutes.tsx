
import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Categories from "@/pages/Categories";
import Notes from "@/pages/Notes";
import Tags from "@/pages/Tags";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Editor from "@/pages/Editor";
import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import TAOPage from "@/pages/tao";
import TAOLayout from "@/pages/tao/layout";
import PerformanceDashboard from "@/pages/tao/performance";
import { useNotes } from "@/contexts/NotesContext";

const AppRoutes = () => {
  const { handleSaveNote, handleDeleteNote } = useNotes();
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      
      <Route element={<MainLayout>{<Outlet />}</MainLayout>}>
        <Route index element={<Index />} />
        
        <Route path="/categories" element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        } />
        
        <Route path="/notes" element={
          <ProtectedRoute>
            <Notes />
          </ProtectedRoute>
        } />
        
        <Route path="/tags" element={
          <ProtectedRoute>
            <Tags />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        {/* Updated to handle both /notes/:id and /editor/:id routes */}
        <Route path="/notes/:id" element={
          <ProtectedRoute>
            <Editor onSaveNote={handleSaveNote} onDeleteNote={handleDeleteNote} />
          </ProtectedRoute>
        } />
        
        {/* Add a redirect from /editor/:id to /notes/:id for compatibility */}
        <Route path="/editor/:id" element={
          <ProtectedRoute>
            <Editor onSaveNote={handleSaveNote} onDeleteNote={handleDeleteNote} />
          </ProtectedRoute>
        } />
        
        <Route path="/tao" element={<TAOLayout />}>
          <Route index element={<TAOPage />} />
          <Route path="performance" element={<PerformanceDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
