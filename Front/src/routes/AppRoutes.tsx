import { Navigate, Route, Routes } from 'react-router-dom';
import PacientesPage from '../pages/Pacientes/PacientesPage';
import RegistrarPacientePage from '../pages/Pacientes/RegistrarPacientePage';
import RolesDemoPage from '../pages/Roles/RolesDemoPage';
import LoginPage from '../pages/Login/LoginPage';
import RegistrarUsuarioPage from '../pages/RegistrarUsuario/RegistrarUsuarioPage';
import RegistrarMedicoPage from '../pages/Medicos/RegistrarMedicoPage';
import DisponibilidadPage from '../pages/Disponibilidad/DisponibilidadPage';
import RegistrarDisponibilidadPage from '../pages/Disponibilidad/RegistrarDisponibilidadPage';
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
        path="/pacientes/nuevo"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'RECEPCIONISTA']}>
            <RegistrarPacientePage />
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
      <Route
        path="/medicos/nuevo"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR']}>
            <RegistrarMedicoPage />
          </RequireAuth>
        }
      />
      <Route
        path="/disponibilidad"
        element={
          <RequireAuth>
            <DisponibilidadPage />
          </RequireAuth>
        }
      />
      <Route
        path="/disponibilidad/nueva"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'MEDICO']}>
            <RegistrarDisponibilidadPage />
          </RequireAuth>
        }
      />
      <Route path="/roles" element={<RolesDemoPage />} />
    </Routes>
  );
}
