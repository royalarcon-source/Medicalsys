import { useState, type FormEvent } from 'react';
import { registrarUsuario, type RolNombre, type UsuarioAutenticado } from '../../services/authService';

const ROLES: { value: RolNombre; label: string }[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'MEDICO', label: 'Médico' },
  { value: 'RECEPCIONISTA', label: 'Recepcionista' },
  { value: 'PACIENTE', label: 'Paciente' },
];

const SEXOS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];

const FORM_INICIAL = {
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  telefono: '',
  rol: 'RECEPCIONISTA' as RolNombre,
  documentoIdentidad: '',
  fechaNacimiento: '',
  sexo: '',
};

export default function RegistrarUsuarioPage() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [usuarioCreado, setUsuarioCreado] = useState<UsuarioAutenticado | null>(null);

  const esPaciente = form.rol === 'PACIENTE';

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

    if (esPaciente) {
      if (!form.documentoIdentidad.trim()) {
        setError('El documento de identidad (CI) es obligatorio para pacientes.');
        return;
      }
      if (!form.fechaNacimiento) {
        setError('La fecha de nacimiento es obligatoria para pacientes.');
        return;
      }
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
        documentoIdentidad: esPaciente ? form.documentoIdentidad.trim() : undefined,
        fechaNacimiento: esPaciente ? form.fechaNacimiento : undefined,
        sexo: esPaciente && form.sexo ? form.sexo : undefined,
      });

      setExito(
        `Usuario ${usuario.nombres} ${usuario.apellidos} registrado con rol ${usuario.rol}.` +
        (esPaciente ? ' El perfil de paciente fue creado automáticamente.' : ''),
      );
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

          {/* Campos adicionales solo para PACIENTE */}
          {esPaciente && (
            <>
              <hr style={{ margin: '8px 0', borderColor: 'var(--border)' }} />
              <p className="hint" style={{ marginBottom: '8px' }}>
                📋 Datos del perfil de paciente (se crean junto con el usuario)
              </p>

              <div className="form-row">
                <label className="form-field">
                  <span className="label">Documento de identidad (CI) *</span>
                  <input
                    type="text"
                    value={form.documentoIdentidad}
                    onChange={actualizarCampo('documentoIdentidad')}
                    placeholder="Ej. 12345678"
                    required={esPaciente}
                  />
                </label>

                <label className="form-field">
                  <span className="label">Fecha de nacimiento *</span>
                  <input
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={actualizarCampo('fechaNacimiento')}
                    required={esPaciente}
                  />
                </label>
              </div>

              <div className="form-row">
                <label className="form-field">
                  <span className="label">Sexo</span>
                  <select value={form.sexo} onChange={actualizarCampo('sexo')}>
                    {SEXOS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {exito && <p className="success">{exito}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar usuario'}
          </button>
        </form>

        {usuarioCreado && usuarioCreado.rol === 'MEDICO' && (
          <p className="hint" style={{ marginTop: '12px' }}>
            ➡️ Ahora podés{' '}
            <a href="/medicos/nuevo">completar la ficha de médico</a> para{' '}
            {usuarioCreado.nombres} (ID usuario: {usuarioCreado.id_usuario}).
          </p>
        )}
      </div>
    </section>
  );
}
