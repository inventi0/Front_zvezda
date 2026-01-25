/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** Support: только тикеты/переписка. Admin: всё. Для /admin/support разрешены оба. */
  requireAdminOrSupport?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireAdminOrSupport = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isSupport, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdminOrSupport) {
    if (!isAdmin && !isSupport) return <Navigate to="/account" replace />;
  } else if (requireAdmin && !isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}
