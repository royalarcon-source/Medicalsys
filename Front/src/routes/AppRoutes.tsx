import { Navigate, Route, Routes } from 'react-router-dom';
import PacientesPage from '../pages/Pacientes/PacientesPage';
import RolesDemoPage from '../pages/Roles/RolesDemoPage';
import LoginPage from '../pages/Login/LoginPage';
import RegistrarUsuarioPage from '../pages/RegistrarUsuario/RegistrarUsuarioPage';
import RequireAuth from './RequireAuth';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pacientes" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/pacientes"
        element={
          <RequireAuth>
            <PacientesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/registrar-usuario"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR']}>
            <RegistrarUsuarioPage />
          </RequireAuth>
        }
      />
      <Route path="/roles" element={<RolesDemoPage />} />
    </Routes>
  );
}
