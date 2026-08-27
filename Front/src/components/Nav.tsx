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

        {token && usuario?.rol === 'ADMINISTRADOR' && (
          <NavLink to="/registrar-usuario" end>
            Registrar usuario
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
