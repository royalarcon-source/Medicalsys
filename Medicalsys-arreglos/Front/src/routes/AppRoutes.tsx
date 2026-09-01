import { Navigate, Route, Routes } from 'react-router-dom';
import PacientesPage from '../pages/Pacientes/PacientesPage';
import RegistrarPacientePage from '../pages/Pacientes/RegistrarPacientePage';
import HistoriaClinicaPage from '../pages/Pacientes/HistoriaClinicaPage';
import RolesDemoPage from '../pages/Roles/RolesDemoPage';
import LoginPage from '../pages/Login/LoginPage';
import RegistrarUsuarioPage from '../pages/RegistrarUsuario/RegistrarUsuarioPage';
import RegistrarMedicoPage from '../pages/Medicos/RegistrarMedicoPage';
import DisponibilidadPage from '../pages/Disponibilidad/DisponibilidadPage';
import RegistrarDisponibilidadPage from '../pages/Disponibilidad/RegistrarDisponibilidadPage';
import GestionCitasPage from '../pages/Citas/GestionCitasPage';
import ReservarCitaPage from '../pages/Citas/ReservarCitaPage';
import ConsultoriosPage from '../pages/Consultorios/ConsultoriosPage';
import RegistrarAtencionPage from '../pages/Consultas/RegistrarAtencionPage';
import ColaAtencionPage from '../pages/Consultas/ColaAtencionPage';
import RegistrarConsultaPage from '../pages/Consultas/RegistrarConsultaPage';
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
        path="/historia-clinica"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO']}>
            <HistoriaClinicaPage />
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
      <Route
        path="/citas"
        element={
          <RequireAuth>
            <GestionCitasPage />
          </RequireAuth>
        }
      />
      <Route
        path="/citas/reservar"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'RECEPCIONISTA', 'PACIENTE']}>
            <ReservarCitaPage />
          </RequireAuth>
        }
      />
      <Route
        path="/consultorios"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO']}>
            <ConsultoriosPage />
          </RequireAuth>
        }
      />
      <Route
        path="/consultas/sin-cita"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'RECEPCIONISTA']}>
            <RegistrarAtencionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/consultas/cola"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO']}>
            <ColaAtencionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/consultas/:id/atender"
        element={
          <RequireAuth rolesPermitidos={['ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO']}>
            <RegistrarConsultaPage />
          </RequireAuth>
        }
      />
      <Route path="/roles" element={<RolesDemoPage />} />
    </Routes>
  );
}
