import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Permissoes } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof Permissoes;
  requireAdmin?: boolean;
  requireAdminPadrao?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requireAdmin,
  requireAdminPadrao
}: ProtectedRouteProps) {
  const { usuario, hasPermission, isAdmin } = useAuth();
  
  const isAdminPadrao = usuario?.id === 'admin_inicial';

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  if (requireAdminPadrao && !isAdminPadrao) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas o administrador padrão pode acessar esta página.</p>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}

