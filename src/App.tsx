
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Notes from "./pages/Notes";
import Auth from "./pages/Auth";
import Editor from "./pages/Editor";
import Categories from "./pages/Categories";
import TokensPage from "./pages/tokens";
import TokenDetail from "./pages/tokens/[id]";
import CryptoDashboard from "./pages/crypto/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/:id?"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tokens"
              element={
                <ProtectedRoute>
                  <TokensPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tokens/:id"
              element={
                <ProtectedRoute>
                  <TokenDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crypto/dashboard"
              element={
                <ProtectedRoute>
                  <CryptoDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
