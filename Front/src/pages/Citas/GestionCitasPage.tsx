import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarCitas,
  cancelarCita,
  reprogramarCita,
  type CitaItem,
} from '../../services/citasService';

export default function GestionCitasPage() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal de reprogramación
  const [citaParaReprogramar, setCitaParaReprogramar] = useState<CitaItem | null>(null);
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');
  const [nuevaFechaFin, setNuevaFechaFin] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [reprogramando, setReprogramando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarCitas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarCitas();
      setCitas(data.citas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las citas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const handleCancelar = async (cita: CitaItem) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de cancelar la cita #${cita.idCita} del ${new Date(cita.fechaHoraInicio).toLocaleString()}?`
    );
    if (!confirmacion) return;

    setError(null);
    setMensajeExito(null);
    try {
      await cancelarCita(cita.idCita);
      setMensajeExito(`La cita #${cita.idCita} ha sido cancelada correctamente.`);
      await cargarCitas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la cita.');
    }
  };

  const abrirModalReprogramar = (cita: CitaItem) => {
    setCitaParaReprogramar(cita);
    // Convertir a formato datetime-local (YYYY-MM-DDTHH:mm)
    const inicioDate = new Date(cita.fechaHoraInicio);
    const finDate = new Date(cita.fechaHoraFin);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocalISO = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setNuevaFechaInicio(toLocalISO(inicioDate));
    setNuevaFechaFin(toLocalISO(finDate));
    setNuevoMotivo(cita.motivo || '');
    setErrorModal(null);
  };

  const handleGuardarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaParaReprogramar) return;

    if (!nuevaFechaInicio || !nuevaFechaFin) {
      setErrorModal('Debe ingresar la nueva fecha y hora de inicio y fin.');
      return;
    }

    setReprogramando(true);
    setErrorModal(null);

    try {
      await reprogramarCita(citaParaReprogramar.idCita, {
        fechaHoraInicio: new Date(nuevaFechaInicio).toISOString(),
        fechaHoraFin: new Date(nuevaFechaFin).toISOString(),
        motivo: nuevoMotivo.trim() || undefined,
      });

      setCitaParaReprogramar(null);
      setMensajeExito(`Cita #${citaParaReprogramar.idCita} reprogramada exitosamente.`);
      await cargarCitas();
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'No se pudo reprogramar la cita.');
    } finally {
      setReprogramando(false);
    }
  };

  const formatearFecha = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const badgeClase = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'badge badge-pendiente';
      case 'CONFIRMADA':
        return 'badge badge-confirmada';
      case 'ATENDIDA':
        return 'badge badge-atendida';
      case 'CANCELADA':
        return 'badge badge-cancelada';
      default:
        return 'badge badge-no_asistio';
    }
  };

  return (
    <section className="page citas-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Gestión de Citas Médicas</h2>
          {(usuario?.rol === 'ADMINISTRADOR' ||
            usuario?.rol === 'RECEPCIONISTA' ||
            usuario?.rol === 'PACIENTE') && (
            <Link to="/citas/reservar" style={{ textDecoration: 'none' }}>
              <button type="button">+ Nueva reserva (HU-15)</button>
            </Link>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {mensajeExito && <p className="success">{mensajeExito}</p>}
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando citas...</p>
        ) : citas.length === 0 ? (
          <p className="empty-state">No hay citas registradas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => {
                const nombrePaciente = cita.paciente?.usuario
                  ? `${cita.paciente.usuario.nombres} ${cita.paciente.usuario.apellidos}`
                  : `CI: ${cita.paciente?.documentoIdentidad || '—'}`;

                const nombreMedico = cita.medico?.usuario
                  ? `Dr. ${cita.medico.usuario.nombres} ${cita.medico.usuario.apellidos}`
                  : `Col. ${cita.medico?.numeroColegiatura || '—'}`;

                const puedeModificar =
                  cita.estado !== 'CANCELADA' && cita.estado !== 'ATENDIDA';

                return (
                  <tr key={cita.idCita}>
                    <td><strong>#{cita.idCita}</strong></td>
                    <td>{nombrePaciente}</td>
                    <td>{nombreMedico}</td>
                    <td>{formatearFecha(cita.fechaHoraInicio)}</td>
                    <td>{formatearFecha(cita.fechaHoraFin)}</td>
                    <td>{cita.motivo || 'Consulta general'}</td>
                    <td>
                      <span className={badgeClase(cita.estado)}>{cita.estado}</span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {puedeModificar ? (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => abrirModalReprogramar(cita)}
                          >
                            Reprogramar
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => handleCancelar(cita)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>Sin acciones</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {citaParaReprogramar && (
        <div className="modal-overlay" onClick={() => setCitaParaReprogramar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reprogramar Cita #{citaParaReprogramar.idCita}</h3>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCitaParaReprogramar(null)}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleGuardarReprogramacion} className="form">
              <div className="form-row">
                <label className="form-field">
                  <span className="label">Nueva fecha y hora de inicio</span>
                  <input
                    type="datetime-local"
                    value={nuevaFechaInicio}
                    onChange={(e) => setNuevaFechaInicio(e.target.value)}
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="label">Nueva fecha y hora de fin</span>
                  <input
                    type="datetime-local"
                    value={nuevaFechaFin}
                    onChange={(e) => setNuevaFechaFin(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="form-field">
                <span className="label">Motivo (opcional)</span>
                <input
                  type="text"
                  value={nuevoMotivo}
                  onChange={(e) => setNuevoMotivo(e.target.value)}
                  placeholder="Motivo de la consulta o reprogramación"
                />
              </label>

              {errorModal && <p className="error">{errorModal}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setCitaParaReprogramar(null)}
                  disabled={reprogramando}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={reprogramando}>
                  {reprogramando ? 'Guardando...' : 'Confirmar reprogramación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
