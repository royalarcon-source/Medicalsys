import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarCitas,
  reprogramarCita,
  cancelarCita,
  type CitaItem,
} from '../../services/citasService';
import {
  listarConsultorios,
  asignarConsultorioACita,
  liberarConsultorioDeCita,
  type ConsultorioItem,
} from '../../services/consultoriosService';
import {
  Calendar,
  UserCheck,
  Building2,
  Clock,
  Plus,
  XCircle,
  CheckCircle2,
  X,
  Edit,
} from 'lucide-react';

type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA' | 'NO_ASISTIO';

export default function GestionCitasPage() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Reprogramación
  const [citaParaReprogramar, setCitaParaReprogramar] = useState<CitaItem | null>(null);
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');
  const [nuevaFechaFin, setNuevaFechaFin] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [reprogramando, setReprogramando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Asignación de Consultorio
  const [citaParaConsultorio, setCitaParaConsultorio] = useState<CitaItem | null>(null);
  const [consultorios, setConsultorios] = useState<ConsultorioItem[]>([]);
  const [idConsultorioSeleccionado, setIdConsultorioSeleccionado] = useState<number | ''>('');
  const [cargandoConsultorios, setCargandoConsultorios] = useState(false);
  const [asignandoConsultorio, setAsignandoConsultorio] = useState(false);
  const [errorModalConsultorio, setErrorModalConsultorio] = useState<string | null>(null);

  const esAdminOGestor =
    usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const cargarCitas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listarCitas();
      setCitas(res.citas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las citas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

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

  const toInputDateTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const abrirModalReprogramar = (cita: CitaItem) => {
    setCitaParaReprogramar(cita);
    setNuevaFechaInicio(toInputDateTime(cita.fechaHoraInicio));
    setNuevaFechaFin(toInputDateTime(cita.fechaHoraFin));
    setNuevoMotivo(cita.motivo || '');
    setErrorModal(null);
  };

  const handleGuardarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaParaReprogramar) return;

    setErrorModal(null);

    const inicio = new Date(nuevaFechaInicio);
    const fin = new Date(nuevaFechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio >= fin) {
      setErrorModal('Rango de fecha y horario inválido.');
      return;
    }

    if (inicio.getTime() < Date.now()) {
      setErrorModal('No se puede reprogramar a una fecha u hora en el pasado.');
      return;
    }

    setReprogramando(true);
    try {
      await reprogramarCita(citaParaReprogramar.idCita, {
        fechaHoraInicio: inicio.toISOString(),
        fechaHoraFin: fin.toISOString(),
        motivo: nuevoMotivo.trim() || undefined,
      });

      setMensajeExito(`Cita #${citaParaReprogramar.idCita} reprogramada exitosamente.`);
      setCitaParaReprogramar(null);
      await cargarCitas();
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Error al reprogramar la cita.');
    } finally {
      setReprogramando(false);
    }
  };

  const handleCancelar = async (cita: CitaItem) => {
    const confirm = window.confirm(`¿Estás seguro de cancelar la cita #${cita.idCita}?`);
    if (!confirm) return;

    setError(null);
    setMensajeExito(null);
    try {
      await cancelarCita(cita.idCita);
      setMensajeExito(`Cita #${cita.idCita} cancelada correctamente.`);
      await cargarCitas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar la cita.');
    }
  };

  const abrirModalConsultorio = async (cita: CitaItem) => {
    setCitaParaConsultorio(cita);
    setIdConsultorioSeleccionado(cita.consultorio?.idConsultorio || '');
    setErrorModalConsultorio(null);
    setCargandoConsultorios(true);

    try {
      const dInicio = new Date(cita.fechaHoraInicio);
      const dFin = new Date(cita.fechaHoraFin);
      const pad = (n: number) => String(n).padStart(2, '0');
      const fecha = `${dInicio.getFullYear()}-${pad(dInicio.getMonth() + 1)}-${pad(dInicio.getDate())}`;
      const horaInicio = `${pad(dInicio.getHours())}:${pad(dInicio.getMinutes())}`;
      const horaFin = `${pad(dFin.getHours())}:${pad(dFin.getMinutes())}`;

      const res = await listarConsultorios({
        fecha,
        horaInicio,
        horaFin,
        excludeCitaId: cita.idCita,
      });
      setConsultorios(res.consultorios || []);
    } catch (err) {
      setErrorModalConsultorio('Error al comprobar disponibilidad de consultorios para este horario.');
    } finally {
      setCargandoConsultorios(false);
    }
  };

  const handleGuardarConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaParaConsultorio || !idConsultorioSeleccionado) return;

    setAsignandoConsultorio(true);
    setErrorModalConsultorio(null);

    try {
      await asignarConsultorioACita(citaParaConsultorio.idCita, Number(idConsultorioSeleccionado));
      setMensajeExito(`Consultorio asignado exitosamente a la cita #${citaParaConsultorio.idCita}.`);
      setCitaParaConsultorio(null);
      await cargarCitas();
    } catch (err) {
      setErrorModalConsultorio(err instanceof Error ? err.message : 'No se pudo asignar el consultorio.');
    } finally {
      setAsignandoConsultorio(false);
    }
  };

  const handleLiberarConsultorio = async () => {
    if (!citaParaConsultorio) return;
    const confirm = window.confirm(`¿Deseas desvincular el consultorio de la cita #${citaParaConsultorio.idCita}?`);
    if (!confirm) return;

    setAsignandoConsultorio(true);
    setErrorModalConsultorio(null);
    try {
      await liberarConsultorioDeCita(citaParaConsultorio.idCita);
      setMensajeExito(`Consultorio desvinculado de la cita #${citaParaConsultorio.idCita}.`);
      setCitaParaConsultorio(null);
      await cargarCitas();
    } catch (err) {
      setErrorModalConsultorio(err instanceof Error ? err.message : 'No se pudo desvincular el consultorio.');
    } finally {
      setAsignandoConsultorio(false);
    }
  };

  const badgeClase = (estado: EstadoCita) => {
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
        <div className="page-header">
          <div>
            <h2>
              <Calendar size={22} className="text-primary" />
              <span>Gestión de Citas Médicas</span>
            </h2>
            <p className="page-header-subtitle">
              Administración centralizada de citas programadas, asignación física y control de estados.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {esAdminOGestor && (
              <Link to="/consultas/sin-cita" style={{ textDecoration: 'none' }}>
                <button type="button" className="button-secondary">
                  <UserCheck size={16} />
                  <span>Atención sin cita</span>
                </button>
              </Link>
            )}
            {(usuario?.rol === 'ADMINISTRADOR' ||
              usuario?.rol === 'RECEPCIONISTA' ||
              usuario?.rol === 'PACIENTE') && (
              <Link to="/citas/reservar" style={{ textDecoration: 'none' }}>
                <button type="button">
                  <Plus size={16} />
                  <span>Nueva reserva</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensajeExito && <div className="alert-success">{mensajeExito}</div>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando citas...</p>
          </div>
        ) : citas.length === 0 ? (
          <div className="empty-state">
            <Calendar size={32} className="empty-state-icon" />
            <p>No hay citas registradas en el sistema.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Consultorio</th>
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
                    ? `Dr(a). ${cita.medico.usuario.nombres} ${cita.medico.usuario.apellidos}`
                    : `Col. ${cita.medico?.numeroColegiatura || '—'}`;

                  const puedeModificar =
                    cita.estado !== 'CANCELADA' && cita.estado !== 'ATENDIDA';

                  return (
                    <tr key={cita.idCita}>
                      <td><strong>#{cita.idCita}</strong></td>
                      <td>
                        <strong>{nombrePaciente}</strong>
                      </td>
                      <td>{nombreMedico}</td>
                      <td>{formatearFecha(cita.fechaHoraInicio)}</td>
                      <td>{formatearFecha(cita.fechaHoraFin)}</td>
                      <td>
                        {cita.consultorio ? (
                          <span className="badge badge-confirmada">
                            <Building2 size={12} />
                            <span>{cita.consultorio.nombre}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={badgeClase(cita.estado)}>{cita.estado}</span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {puedeModificar ? (
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {esAdminOGestor && (
                              <button
                                type="button"
                                className="button-secondary button-sm"
                                onClick={() => abrirModalConsultorio(cita)}
                              >
                                <Building2 size={13} />
                                <span>{cita.consultorio ? 'Reasignar' : 'Asignar'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="button-secondary button-sm"
                              onClick={() => abrirModalReprogramar(cita)}
                            >
                              <Edit size={13} />
                              <span>Reprogramar</span>
                            </button>
                            <button
                              type="button"
                              className="button-outline-danger button-sm"
                              onClick={() => handleCancelar(cita)}
                            >
                              <XCircle size={13} />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {citaParaReprogramar && (
        <div className="modal-overlay" onClick={() => setCitaParaReprogramar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Calendar size={20} className="text-primary" />
                <span>Reprogramar Cita #{citaParaReprogramar.idCita}</span>
              </h3>
              <button
                type="button"
                className="button-secondary button-sm button-icon"
                onClick={() => setCitaParaReprogramar(null)}
              >
                <X size={16} />
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

              {errorModal && <div className="alert-error">{errorModal}</div>}

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
                  <CheckCircle2 size={16} />
                  <span>{reprogramando ? 'Guardando...' : 'Confirmar reprogramación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {citaParaConsultorio && (
        <div className="modal-overlay" onClick={() => setCitaParaConsultorio(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>
                <Building2 size={20} className="text-primary" />
                <span>Asignar Consultorio Físico</span>
              </h3>
              <button
                type="button"
                className="button-secondary button-sm button-icon"
                onClick={() => setCitaParaConsultorio(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '13px', background: 'var(--bg-page)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <p style={{ margin: '2px 0' }}>
                <strong>Cita:</strong> #{citaParaConsultorio.idCita} ({formatearFecha(citaParaConsultorio.fechaHoraInicio)} a {formatearFecha(citaParaConsultorio.fechaHoraFin)})
              </p>
              <p style={{ margin: '2px 0' }}>
                <strong>Médico:</strong> {citaParaConsultorio.medico?.usuario?.nombres} {citaParaConsultorio.medico?.usuario?.apellidos}
              </p>
              {citaParaConsultorio.consultorio && (
                <p style={{ margin: '2px 0', color: 'var(--primary-text)', fontWeight: 600 }}>
                  Consultorio actual: {citaParaConsultorio.consultorio.nombre}
                </p>
              )}
            </div>

            <form onSubmit={handleGuardarConsultorio} className="form">
              <label className="form-field">
                <span className="label">Seleccionar Consultorio Físico:</span>
                {cargandoConsultorios ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verificando disponibilidad de consultorios...</p>
                ) : consultorios.length === 0 ? (
                  <p className="empty-state">No hay consultorios registrados.</p>
                ) : (
                  <select
                    value={idConsultorioSeleccionado}
                    onChange={(e) => setIdConsultorioSeleccionado(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">-- Seleccionar un consultorio --</option>
                    {consultorios.map((c) => (
                      <option
                        key={c.idConsultorio}
                        value={c.idConsultorio}
                        disabled={c.disponible === false}
                      >
                        {c.nombre} (Piso {c.piso || '1'} - {c.tipo}) {c.disponible === false ? '[OCUPADO EN ESTE HORARIO]' : '[DISPONIBLE]'}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {errorModalConsultorio && <div className="alert-error">{errorModalConsultorio}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                {citaParaConsultorio.consultorio ? (
                  <button
                    type="button"
                    className="button-outline-danger"
                    onClick={handleLiberarConsultorio}
                    disabled={asignandoConsultorio}
                  >
                    Liberar consultorio
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setCitaParaConsultorio(null)}
                    disabled={asignandoConsultorio}
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={asignandoConsultorio || !idConsultorioSeleccionado}>
                    <CheckCircle2 size={16} />
                    <span>{asignandoConsultorio ? 'Guardando...' : 'Confirmar Asignación'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
