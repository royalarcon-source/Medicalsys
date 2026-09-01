import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as loginRequest } from '../../services/authService';

export default function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) {
    const destino = (location.state as { from?: string } | null)?.from ?? '/pacientes';
    return <Navigate to={destino} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Debes ingresar usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const respuesta = await loginRequest(email.trim(), password);
      login(respuesta.token, respuesta.usuario);
      const destino = (location.state as { from?: string } | null)?.from ?? '/pacientes';
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page login-page">
      <div className="card">
        <h2>Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className="form">
          <label className="form-field">
            <span className="label">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@medicalsys.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="form-field">
            <span className="label">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </section>
  );
}
