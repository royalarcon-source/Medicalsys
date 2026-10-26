import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RolNombre } from '../services/authService';

interface RequireAuthProps {
  children: ReactNode;
  rolesPermitidos?: RolNombre[];
}

export default function RequireAuth({ children, rolesPermitidos }: RequireAuthProps) {
  const { token, usuario } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (rolesPermitidos && (!usuario || !rolesPermitidos.includes(usuario.rol))) {
    return <Navigate to="/pacientes" replace />;
  }

  return <>{children}</>;
}
