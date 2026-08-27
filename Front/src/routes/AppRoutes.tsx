import { Navigate, Route, Routes } from 'react-router-dom';
import PacientesPage from '../pages/Pacientes/PacientesPage';
import RolesDemoPage from '../pages/Roles/RolesDemoPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pacientes" replace />} />
      <Route path="/pacientes" element={<PacientesPage />} />
      <Route path="/roles" element={<RolesDemoPage />} />
    </Routes>
  );
}
