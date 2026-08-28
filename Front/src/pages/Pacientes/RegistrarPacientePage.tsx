import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { crearPaciente } from '../../services/pacientesService';

const SEXOS = [
  { value: '', label: 'Seleccionar...' },
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
    <section className="page">
      <div className="card">
        <h2>Registrar paciente</h2>
        <p className="hint">
          El paciente debe tener primero un usuario con rol PACIENTE (ver "Registrar usuario").
          Luego completa aquí su ficha clínica básica indicando el ID de ese usuario.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label className="form-field">
              <span className="label">ID de usuario (rol PACIENTE)</span>
              <input
                type="number"
                min={1}
                value={form.idUsuario}
                onChange={actualizarCampo('idUsuario')}
                required
              />
            </label>

            <label className="form-field">
              <span className="label">CI</span>
              <input
                type="text"
                value={form.documentoIdentidad}
                onChange={actualizarCampo('documentoIdentidad')}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Fecha de nacimiento</span>
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
              <input type="text" value={form.direccion} onChange={actualizarCampo('direccion')} />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="label">Contacto de emergencia</span>
              <input
                type="text"
                value={form.contactoEmergencia}
                onChange={actualizarCampo('contactoEmergencia')}
              />
            </label>

            <label className="form-field">
              <span className="label">Teléfono de emergencia</span>
              <input
                type="tel"
                value={form.telefonoEmergencia}
                onChange={actualizarCampo('telefonoEmergencia')}
              />
            </label>
          </div>

          {error && <p className="error">{error}</p>}
          {exito && <p className="success">{exito}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar paciente'}
          </button>
        </form>
      </div>
    </section>
  );
}
