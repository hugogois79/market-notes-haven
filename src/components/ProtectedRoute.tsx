import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Routes that workers are allowed to access
const WORKER_ALLOWED_ROUTES = [
  "/expenses",
  "/profile",
  "/settings",
];

const LOADING_TIMEOUT_MS = 12000; // 12 seconds before showing fallback

const isWorkerAllowedRoute = (pathname: string): boolean => {
  return WORKER_ALLOWED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isWorker, loading: roleLoading, timedOut } = useUserRole();
  const location = useLocation();
  const [showFallback, setShowFallback] = useState(false);

  const loading = authLoading || roleLoading;

  // Show fallback UI after extended loading
  useEffect(() => {
    if (!loading) {
      setShowFallback(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("ProtectedRoute: loading timeout reached");
        setShowFallback(true);
      }
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    console.log("ProtectedRoute", { 
      user: user?.id, 
      authLoading, 
      isWorker, 
      roleLoading, 
      timedOut,
      pathname: location.pathname 
    });
  }, [user, authLoading, isWorker, roleLoading, timedOut, location.pathname]);

  // Extended loading fallback
  if (showFallback && loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 p-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-center">
          A carregar está a demorar mais do que o esperado...
        </p>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button onClick={() => window.location.href = "/auth"} variant="secondary">
            <LogIn className="h-4 w-4 mr-2" />
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">A carregar...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is a worker and trying to access a non-allowed route, redirect to expenses
  if (isWorker && !isWorkerAllowedRoute(location.pathname)) {
    return <Navigate to="/expenses" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
