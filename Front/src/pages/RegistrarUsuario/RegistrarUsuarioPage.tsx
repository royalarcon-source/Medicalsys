import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registrarUsuario, type RolNombre, type UsuarioAutenticado } from '../../services/authService';
import { UserPlus, FileText, CheckCircle2, AlertCircle, Save, ArrowRight } from 'lucide-react';

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
    <section className="page registrar-usuario-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <UserPlus size={22} className="text-primary" />
              <span>Registrar Nuevo Usuario</span>
            </h2>
            <p className="page-header-subtitle">
              Creación de cuentas de acceso al sistema para administradores, médicos, recepcionistas y pacientes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form" style={{ marginTop: '12px' }}>
          <div className="form-row">
            <label className="form-field">
              <span className="label">Nombres *</span>
              <input type="text" value={form.nombres} onChange={actualizarCampo('nombres')} placeholder="Ej. Carlos" required />
            </label>

            <label className="form-field">
              <span className="label">Apellidos *</span>
              <input type="text" value={form.apellidos} onChange={actualizarCampo('apellidos')} placeholder="Ej. Gómez" required />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Correo electrónico *</span>
              <input type="email" value={form.email} onChange={actualizarCampo('email')} placeholder="carlos.gomez@clinica.com" required />
            </label>

            <label className="form-field">
              <span className="label">Teléfono</span>
              <input type="tel" value={form.telefono} onChange={actualizarCampo('telefono')} placeholder="Ej. 0981234567" />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Contraseña *</span>
              <input
                type="password"
                value={form.password}
                onChange={actualizarCampo('password')}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Rol del Usuario *</span>
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
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--text-main)', fontWeight: 600 }}>
                <FileText size={16} className="text-primary" />
                <span>Datos del perfil de paciente (se crean junto con el usuario)</span>
              </div>

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

              <div className="form-row" style={{ marginTop: '10px' }}>
                <label className="form-field">
                  <span className="label">Sexo</span>
                  <select value={form.sexo} onChange={actualizarCampo('sexo')}>
                    {SEXOS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {exito && (
            <div className="alert-success">
              <CheckCircle2 size={16} />
              <span>{exito}</span>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Registrando...' : 'Registrar usuario'}</span>
            </button>
          </div>
        </form>

        {usuarioCreado && usuarioCreado.rol === 'MEDICO' && (
          <div style={{ marginTop: '14px', padding: '12px 16px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
            <Link to="/medicos/nuevo" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--primary-text)' }}>
              <span>Completar la ficha de médico para {usuarioCreado.nombres} (ID: {usuarioCreado.id_usuario})</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
