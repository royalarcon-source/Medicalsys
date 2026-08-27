import { NavLink } from 'react-router-dom';

export default function Nav() {
  return (
    <nav className="nav" aria-label="Navegación principal">
      <NavLink to="/pacientes" end>
        Pacientes
      </NavLink>
      <NavLink to="/roles" end>
        Roles
      </NavLink>
    </nav>
  );
}
