import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export function ProtectedRoute({ 
  children, 
  allowExpired = false 
}: { 
  children: ReactNode; 
  allowExpired?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-graphite-500">
        Carregando...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isExpired = new Date(user.subscriptionEnd) < new Date();
  if (isExpired && !allowExpired) {
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
}
