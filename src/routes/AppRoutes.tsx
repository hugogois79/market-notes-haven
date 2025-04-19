
import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Notes from "@/pages/Notes";
import Categories from "@/pages/Categories";
import Tags from "@/pages/Tags";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import Editor from "@/pages/Editor";
import Index from "@/pages/Index";
import TokensDashboard from "@/pages/tokens";
import TokenDetail from "@/pages/tokens/[id]";
import CryptoDashboard from "@/pages/crypto/Dashboard";

// TAO-specific routes
import TAOLayout from "@/pages/tao/layout";
import TAODashboard from "@/pages/tao/index";
import TAOPerformance from "@/pages/tao/performance";
import TAOValidatorRelationshipManagement from "@/pages/tao/validator-relationship-management";
import InvestorOpportunitiesPage from "@/pages/tao/investor-opportunities";
import FollowUpSequencesPage from "@/pages/tao/follow-up-sequences";
import { Note } from "@/types";

const AppRoutes = () => {
  // Create proper props for Editor component to satisfy TypeScript
  const editorProps = {
    onSaveNote: (note: Note): Promise<Note | null> => {
      console.log("Save note called from route", note);
      // Return the same note to satisfy the Promise<Note | null> return type
      return Promise.resolve(note);
    },
    onDeleteNote: (noteId: string): Promise<boolean> => {
      console.log("Delete note called from route", noteId);
      return Promise.resolve(true);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout><Index /></MainLayout>}>
          <Route index element={<Index />} />
          <Route path="auth" element={<Auth />} />
          <Route
            path="notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="tags"
            element={
              <ProtectedRoute>
                <Tags />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="editor/:id"
            element={
              <ProtectedRoute>
                <Editor {...editorProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="tokens"
            element={
              <ProtectedRoute>
                <TokensDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="tokens/:id"
            element={
              <ProtectedRoute>
                <TokenDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="crypto/dashboard"
            element={
              <ProtectedRoute>
                <CryptoDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* TAO Routes */}
          <Route path="tao" element={<TAOLayout />}>
            <Route index element={<TAODashboard />} />
            <Route path="performance" element={<TAOPerformance />} />
            <Route
              path="validator-relationship-management"
              element={<TAOValidatorRelationshipManagement />}
            />
            <Route
              path="investor-opportunities"
              element={<InvestorOpportunitiesPage />}
            />
            <Route
              path="follow-up-sequences"
              element={<FollowUpSequencesPage />}
            />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
      <SonnerToaster position="top-right" />
    </>
  );
};

export default AppRoutes;
