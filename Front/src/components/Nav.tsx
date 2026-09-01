import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Users,
  UserPlus,
  FileText,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Pill,
  Shield,
  LogOut,
  LogIn,
  UserCheck,
} from 'lucide-react';

export default function Nav() {
  const { token, usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="nav" aria-label="Navegación principal">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NavLink to={token ? "/pacientes" : "/login"} className="nav-brand">
          <div className="nav-brand-icon">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <span>MedicalSys</span>
        </NavLink>

        <div className="nav-links">
          {token && (
            <NavLink to="/pacientes" end>
              <Users size={16} />
              <span>Pacientes</span>
            </NavLink>
          )}

          {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA') && (
            <NavLink to="/pacientes/nuevo" end>
              <UserPlus size={16} />
              <span>Registrar paciente</span>
            </NavLink>
          )}

          {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA' || usuario?.rol === 'MEDICO') && (
            <NavLink to="/historia-clinica" end>
              <FileText size={16} />
              <span>Historia Clínica</span>
            </NavLink>
          )}

          {token && usuario?.rol === 'ADMINISTRADOR' && (
            <NavLink to="/registrar-usuario" end>
              <UserCheck size={16} />
              <span>Registrar usuario</span>
            </NavLink>
          )}

          {token && usuario?.rol === 'ADMINISTRADOR' && (
            <NavLink to="/medicos/nuevo" end>
              <Stethoscope size={16} />
              <span>Registrar médico</span>
            </NavLink>
          )}

          {token && (
            <NavLink to="/disponibilidad" end>
              <Clock size={16} />
              <span>Disponibilidad</span>
            </NavLink>
          )}

          {token && (
            <NavLink to="/citas" end>
              <Calendar size={16} />
              <span>Citas</span>
            </NavLink>
          )}

          {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA' || usuario?.rol === 'MEDICO') && (
            <NavLink to="/consultas/cola" end>
              <Users size={16} />
              <span>Cola de Espera</span>
            </NavLink>
          )}

          {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA' || usuario?.rol === 'MEDICO') && (
            <NavLink to="/consultorios" end>
              <Building2 size={16} />
              <span>Consultorios</span>
            </NavLink>
          )}

          {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'MEDICO' || usuario?.rol === 'PACIENTE') && (
            <NavLink to="/diagnosticos" end>
              <FileText size={16} />
              <span>Diagnósticos</span>
            </NavLink>
          )}

          {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'MEDICO' || usuario?.rol === 'PACIENTE') && (
            <NavLink to="/tratamientos" end>
              <Pill size={16} />
              <span>Tratamientos</span>
            </NavLink>
          )}

          <NavLink to="/roles" end>
            <Shield size={16} />
            <span>Roles</span>
          </NavLink>
        </div>
      </div>

      <div className="nav-account">
        {token && usuario ? (
          <>
            <div className="nav-user-badge">
              <span>{usuario.nombres}</span>
              <span className="nav-user-role">{usuario.rol}</span>
            </div>
            <button type="button" className="button-secondary button-sm" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={15} />
              <span>Salir</span>
            </button>
          </>
        ) : (
          <NavLink to="/login" className="btn btn-primary button-sm" end>
            <LogIn size={15} />
            <span>Iniciar sesión</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}
