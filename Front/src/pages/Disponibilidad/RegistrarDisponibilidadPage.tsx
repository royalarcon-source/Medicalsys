import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  buscarDisponibilidad,
  desactivarDisponibilidad,
  registrarDisponibilidad,
  type DisponibilidadResultado,
} from '../../services/disponibilidadService';
import { Clock, Calendar, CheckCircle2, AlertCircle, XCircle, Save, Eye } from 'lucide-react';

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

function nombreDia(diaSemana: number): string {
  return DIAS_SEMANA.find((dia) => dia.value === diaSemana)?.label ?? String(diaSemana);
}

interface FormState {
  idMedico: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

function estadoInicial(): FormState {
  return { idMedico: '', diaSemana: 1, horaInicio: '', horaFin: '' };
}

export default function RegistrarDisponibilidadPage() {
  const { usuario } = useAuth();
  const esAdministrador = usuario?.rol === 'ADMINISTRADOR';

  const [form, setForm] = useState<FormState>(estadoInicial());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [horarios, setHorarios] = useState<DisponibilidadResultado[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);

  const cargarHorarios = useCallback(
    async (idMedico?: number) => {
      if (esAdministrador && !idMedico) {
        setHorarios([]);
        return;
      }

      setLoadingHorarios(true);
      setErrorHorarios(null);

      try {
        const respuesta = await buscarDisponibilidad(idMedico ? { idMedico } : {});
        setHorarios(respuesta.resultados);
      } catch (err) {
        setErrorHorarios(err instanceof Error ? err.message : 'No se pudieron cargar los horarios.');
      } finally {
        setLoadingHorarios(false);
      }
    },
    [esAdministrador],
  );

  useEffect(() => {
    if (!esAdministrador) {
      void cargarHorarios();
    }
  }, [esAdministrador, cargarHorarios]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(null);

    const idMedico = esAdministrador ? Number(form.idMedico) : undefined;

    if (esAdministrador && (!Number.isInteger(idMedico) || (idMedico as number) <= 0)) {
      setError('Debes indicar el ID del médico.');
      return;
    }

    if (!form.horaInicio || !form.horaFin) {
      setError('Hora de inicio y hora de fin son obligatorias.');
      return;
    }

    setLoading(true);
    try {
      await registrarDisponibilidad({
        idMedico,
        diaSemana: form.diaSemana,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
      });

      setExito('Disponibilidad registrada correctamente.');
      setForm((prev) => ({ ...estadoInicial(), idMedico: prev.idMedico }));
      await cargarHorarios(idMedico);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la disponibilidad.');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (idHorario: number) => {
    setErrorHorarios(null);
    try {
      await desactivarDisponibilidad(idHorario);
      await cargarHorarios(esAdministrador ? Number(form.idMedico) : undefined);
    } catch (err) {
      setErrorHorarios(err instanceof Error ? err.message : 'No se pudo desactivar el horario.');
    }
  };

  return (
    <section className="page registrar-disponibilidad-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Clock size={22} className="text-primary" />
              <span>Registrar Disponibilidad Médica</span>
            </h2>
            <p className="page-header-subtitle">
              {esAdministrador
                ? 'Indica el ID del médico y el bloque horario que deseas registrar en su agenda.'
                : 'Registra los bloques horarios en los que estarás disponible para atender citas.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form" style={{ marginTop: '12px' }}>
          {esAdministrador && (
            <div className="form-row">
              <label className="form-field">
                <span className="label">ID de médico *</span>
                <input
                  type="number"
                  min={1}
                  value={form.idMedico}
                  onChange={(event) => setForm((prev) => ({ ...prev, idMedico: event.target.value }))}
                  placeholder="Ej. 3"
                  required
                />
              </label>
            </div>
          )}

          <div className="form-row">
            <label className="form-field">
              <span className="label">Día de la semana *</span>
              <select
                value={form.diaSemana}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, diaSemana: Number(event.target.value) }))
                }
              >
                {DIAS_SEMANA.map((dia) => (
                  <option key={dia.value} value={dia.value}>
                    {dia.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="label">Hora de inicio *</span>
              <input
                type="time"
                value={form.horaInicio}
                onChange={(event) => setForm((prev) => ({ ...prev, horaInicio: event.target.value }))}
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Hora de fin *</span>
              <input
                type="time"
                value={form.horaFin}
                onChange={(event) => setForm((prev) => ({ ...prev, horaFin: event.target.value }))}
                required
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
              <span>{loading ? 'Registrando...' : 'Registrar disponibilidad'}</span>
            </button>

            {esAdministrador && (
              <button
                type="button"
                className="button-secondary"
                onClick={() => cargarHorarios(Number(form.idMedico))}
              >
                <Eye size={15} />
                <span>Ver horarios de este médico</span>
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 10px', borderBottom: '1px solid var(--border)' }}>
          <h3>
            <Calendar size={18} className="text-primary" />
            <span>Horarios Registrados</span>
          </h3>
        </div>

        {loadingHorarios ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando horarios...</p>
          </div>
        ) : errorHorarios ? (
          <div style={{ padding: '20px' }}>
            <div className="alert-error">{errorHorarios}</div>
          </div>
        ) : horarios.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>No hay horarios registrados todavía.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Hora inicio</th>
                  <th>Hora fin</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((horario) => (
                  <tr key={horario.idHorario}>
                    <td>
                      <span className="badge badge-neutral">
                        <Calendar size={12} />
                        <span>{nombreDia(horario.diaSemana)}</span>
                      </span>
                    </td>
                    <td>{horario.horaInicio}</td>
                    <td>{horario.horaFin}</td>
                    <td>
                      <span className={horario.activo ? 'badge badge-atendida' : 'badge badge-cancelada'}>
                        {horario.activo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{horario.activo ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {horario.activo && (
                        <button
                          type="button"
                          className="button-outline-danger button-sm"
                          onClick={() => handleDesactivar(horario.idHorario)}
                        >
                          <XCircle size={13} />
                          <span>Desactivar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
