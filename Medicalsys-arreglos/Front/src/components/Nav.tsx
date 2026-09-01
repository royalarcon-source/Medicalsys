import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Nav() {
  const { token, usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="nav" aria-label="Navegación principal">
      <div className="nav-links">
        {token && (
          <NavLink to="/pacientes" end>
            Pacientes
          </NavLink>
        )}

        {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA') && (
          <NavLink to="/pacientes/nuevo" end>
            Registrar paciente
          </NavLink>
        )}

        {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA' || usuario?.rol === 'MEDICO') && (
          <NavLink to="/historia-clinica" end>
            Historia Clínica
          </NavLink>
        )}

        {token && usuario?.rol === 'ADMINISTRADOR' && (
          <NavLink to="/registrar-usuario" end>
            Registrar usuario
          </NavLink>
        )}

        {token && usuario?.rol === 'ADMINISTRADOR' && (
          <NavLink to="/medicos/nuevo" end>
            Registrar médico
          </NavLink>
        )}

        {token && (
          <NavLink to="/disponibilidad" end>
            Disponibilidad
          </NavLink>
        )}

        {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'MEDICO') && (
          <NavLink to="/disponibilidad/nueva" end>
            Registrar disponibilidad
          </NavLink>
        )}

        {token && (
          <NavLink to="/citas" end>
            Citas
          </NavLink>
        )}

        {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA' || usuario?.rol === 'MEDICO') && (
          <NavLink to="/consultas/cola" end>
            Cola de Espera
          </NavLink>
        )}

        {token && (usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA' || usuario?.rol === 'MEDICO') && (
          <NavLink to="/consultorios" end>
            Consultorios
          </NavLink>
        )}

        <NavLink to="/roles" end>
          Roles
        </NavLink>
      </div>

      <div className="nav-account">
        {token && usuario ? (
          <>
            <span className="label">
              {usuario.nombres} · {usuario.rol}
            </span>
            <button type="button" onClick={handleLogout}>
              Salir
            </button>
          </>
        ) : (
          <NavLink to="/login" end>
            Iniciar sesión
          </NavLink>
        )}
      </div>
    </nav>
  );
}
