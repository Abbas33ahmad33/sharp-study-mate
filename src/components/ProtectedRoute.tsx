import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireContentCreator?: boolean;
  requireInstitute?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireContentCreator = false, requireInstitute = false }: ProtectedRouteProps) => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && userRole !== "admin") {
    return <Navigate to="/student" replace />;
  }

  if (requireContentCreator && userRole !== "content_creator") {
    return <Navigate to="/student" replace />;
  }

  if (requireInstitute && userRole !== "institute") {
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;