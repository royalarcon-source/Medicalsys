import { useState, type FormEvent } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { crearPaciente } from '../../services/pacientesService';
import { UserPlus, Save, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

const SEXOS = [
  { value: '', label: 'Seleccionar sexo...' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];

interface FormState {
  idUsuario: string;
  documentoIdentidad: string;
  fechaNacimiento: string;
  sexo: string;
  direccion: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
}

function estadoInicial(idUsuario = ''): FormState {
  return {
    idUsuario,
    documentoIdentidad: '',
    fechaNacimiento: '',
    sexo: '',
    direccion: '',
    contactoEmergencia: '',
    telefonoEmergencia: '',
  };
}

export default function RegistrarPacientePage() {
  const location = useLocation();
  const idUsuarioPrellenado = (location.state as { idUsuario?: number } | null)?.idUsuario;

  const [form, setForm] = useState<FormState>(
    estadoInicial(idUsuarioPrellenado ? String(idUsuarioPrellenado) : ''),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const actualizarCampo = (campo: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [campo]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(null);

    const idUsuario = Number(form.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      setError('Debes indicar el ID de un usuario con rol PACIENTE.');
      return;
    }

    if (!form.documentoIdentidad.trim() || !form.fechaNacimiento) {
      setError('CI y fecha de nacimiento son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const respuesta = await crearPaciente({
        idUsuario,
        documentoIdentidad: form.documentoIdentidad.trim(),
        fechaNacimiento: form.fechaNacimiento,
        sexo: form.sexo || undefined,
        direccion: form.direccion.trim() || undefined,
        contactoEmergencia: form.contactoEmergencia.trim() || undefined,
        telefonoEmergencia: form.telefonoEmergencia.trim() || undefined,
      });

      setExito(`Paciente registrado correctamente (CI ${respuesta.paciente.documentoIdentidad}).`);
      setForm(estadoInicial());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page registrar-paciente-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <UserPlus size={22} className="text-primary" />
              <span>Registrar Ficha de Paciente</span>
            </h2>
            <p className="page-header-subtitle">
              El paciente debe tener primero un usuario con rol PACIENTE. Luego completa aquí su ficha clínica básica.
            </p>
          </div>
          <Link to="/pacientes" style={{ textDecoration: 'none' }}>
            <button type="button" className="button-secondary">
              <Users size={16} />
              <span>Ver Pacientes</span>
            </button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="form" style={{ marginTop: '12px' }}>
          <div className="form-row">
            <label className="form-field">
              <span className="label">ID de usuario (rol PACIENTE) *</span>
              <input
                type="number"
                min={1}
                value={form.idUsuario}
                onChange={actualizarCampo('idUsuario')}
                placeholder="Ej. 5"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Documento CI *</span>
              <input
                type="text"
                value={form.documentoIdentidad}
                onChange={actualizarCampo('documentoIdentidad')}
                placeholder="Ej. 12345678"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Fecha de nacimiento *</span>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={actualizarCampo('fechaNacimiento')}
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Sexo</span>
              <select value={form.sexo} onChange={actualizarCampo('sexo')}>
                {SEXOS.map((sexo) => (
                  <option key={sexo.value} value={sexo.value}>
                    {sexo.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Dirección</span>
              <input
                type="text"
                value={form.direccion}
                onChange={actualizarCampo('direccion')}
                placeholder="Calle, número, ciudad..."
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Contacto de emergencia (Nombre)</span>
              <input
                type="text"
                value={form.contactoEmergencia}
                onChange={actualizarCampo('contactoEmergencia')}
                placeholder="Nombre del familiar o contacto"
              />
            </label>

            <label className="form-field">
              <span className="label">Teléfono de emergencia</span>
              <input
                type="tel"
                value={form.telefonoEmergencia}
                onChange={actualizarCampo('telefonoEmergencia')}
                placeholder="Ej. 098123456"
              />
            </label>
          </div>

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
              <span>{loading ? 'Registrando...' : 'Registrar paciente'}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
