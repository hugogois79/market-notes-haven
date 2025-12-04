import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Routes that workers are allowed to access
const WORKER_ALLOWED_ROUTES = [
  "/expenses",
  "/profile",
  "/settings",
];

const isWorkerAllowedRoute = (pathname: string): boolean => {
  return WORKER_ALLOWED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isWorker, loading: roleLoading } = useUserRole();
  const location = useLocation();

  const loading = authLoading || roleLoading;

  useEffect(() => {
    console.log("ProtectedRoute", { user, authLoading, isWorker, roleLoading, pathname: location.pathname });
  }, [user, authLoading, isWorker, roleLoading, location.pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
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
