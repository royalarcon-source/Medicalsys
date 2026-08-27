import { Navigate, Route, Routes } from 'react-router-dom';
import PacientesPage from '../pages/Pacientes/PacientesPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pacientes" replace />} />
      <Route path="/pacientes" element={<PacientesPage />} />
    </Routes>
  );
}
