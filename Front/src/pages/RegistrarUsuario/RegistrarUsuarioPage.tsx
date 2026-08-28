import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registrarUsuario, type RolNombre, type UsuarioAutenticado } from '../../services/authService';

const ROLES: { value: RolNombre; label: string }[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'MEDICO', label: 'Médico' },
  { value: 'RECEPCIONISTA', label: 'Recepcionista' },
  { value: 'PACIENTE', label: 'Paciente' },
];

const FORM_INICIAL = {
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  telefono: '',
  rol: 'RECEPCIONISTA' as RolNombre,
};

export default function RegistrarUsuarioPage() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [usuarioCreado, setUsuarioCreado] = useState<UsuarioAutenticado | null>(null);

  const actualizarCampo = (campo: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [campo]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(null);
    setUsuarioCreado(null);

    if (!form.nombres.trim() || !form.apellidos.trim() || !form.email.trim() || !form.password) {
      setError('Nombres, apellidos, correo y contraseña son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const usuario = await registrarUsuario({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: form.rol,
        telefono: form.telefono.trim() || undefined,
      });

      setExito(`Usuario ${usuario.nombres} ${usuario.apellidos} registrado con rol ${usuario.rol}.`);
      setUsuarioCreado(usuario);
      setForm(FORM_INICIAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <div className="card">
        <h2>Registrar usuario</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label className="form-field">
              <span className="label">Nombres</span>
              <input type="text" value={form.nombres} onChange={actualizarCampo('nombres')} required />
            </label>

            <label className="form-field">
              <span className="label">Apellidos</span>
              <input type="text" value={form.apellidos} onChange={actualizarCampo('apellidos')} required />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Correo electrónico</span>
              <input type="email" value={form.email} onChange={actualizarCampo('email')} required />
            </label>

            <label className="form-field">
              <span className="label">Teléfono</span>
              <input type="tel" value={form.telefono} onChange={actualizarCampo('telefono')} />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Contraseña</span>
              <input
                type="password"
                value={form.password}
                onChange={actualizarCampo('password')}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Rol</span>
              <select value={form.rol} onChange={actualizarCampo('rol')}>
                {ROLES.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="error">{error}</p>}
          {exito && <p className="success">{exito}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar usuario'}
          </button>
        </form>

        {usuarioCreado && usuarioCreado.rol === 'PACIENTE' && (
          <p className="hint">
            <Link to="/pacientes/nuevo" state={{ idUsuario: usuarioCreado.id_usuario }}>
              Completar ficha de paciente para {usuarioCreado.nombres}
            </Link>
          </p>
        )}

        {usuarioCreado && usuarioCreado.rol === 'MEDICO' && (
          <p className="hint">
            <Link to="/medicos/nuevo" state={{ idUsuario: usuarioCreado.id_usuario }}>
              Completar ficha de médico para {usuarioCreado.nombres}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
