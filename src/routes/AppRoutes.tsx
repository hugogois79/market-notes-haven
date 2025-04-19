
import React from "react";
import { Routes, Route } from "react-router-dom";
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      
      <Route element={<MainLayout children={undefined} />}>
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
        
        <Route path="/notes/:id" element={
          <ProtectedRoute>
            <Editor onSaveNote={() => {}} onDeleteNote={() => {}} />
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
