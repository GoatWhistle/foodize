import type { ReactNode } from 'react';
import type { Permission } from '@shared/types/models';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { useAuthStore } from './store/useAuthStore';
import { selectIsAuthenticated } from '@shared/store/createAuthStore';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
};

export const RoleProtectedRoute = ({
  children,
  permission,
}: {
  children: ReactNode;
  permission?: Permission;
}) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const permissions = useAuthStore((s) => s.user?.permissions);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  if (permission && !permissions?.includes(permission)) return <Navigate to={ROUTES.HOME} replace />;
  return children;
};
