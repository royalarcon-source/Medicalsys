import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarCitas,
  cancelarCita,
  reprogramarCita,
  type CitaItem,
} from '../../services/citasService';
import {
  listarConsultorios,
  asignarConsultorioACita,
  liberarConsultorioDeCita,
  type ConsultorioItem,
} from '../../services/consultoriosService';

export default function GestionCitasPage() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const esAdminOGestor =
    usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const [citaParaReprogramar, setCitaParaReprogramar] = useState<CitaItem | null>(null);
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');
  const [nuevaFechaFin, setNuevaFechaFin] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [reprogramando, setReprogramando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [citaParaConsultorio, setCitaParaConsultorio] = useState<CitaItem | null>(null);
  const [consultorios, setConsultorios] = useState<ConsultorioItem[]>([]);
  const [idConsultorioSeleccionado, setIdConsultorioSeleccionado] = useState<number | ''>('');
  const [cargandoConsultorios, setCargandoConsultorios] = useState(false);
  const [asignandoConsultorio, setAsignandoConsultorio] = useState(false);
  const [errorModalConsultorio, setErrorModalConsultorio] = useState<string | null>(null);

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
      setErrorModalConsultorio('Error al consultar disponibilidad de consultorios.');
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
    setAsignandoConsultorio(true);
    setErrorModalConsultorio(null);

    try {
      await liberarConsultorioDeCita(citaParaConsultorio.idCita);
      setMensajeExito(`Consultorio liberado de la cita #${citaParaConsultorio.idCita}.`);
      setCitaParaConsultorio(null);
      await cargarCitas();
    } catch (err) {
      setErrorModalConsultorio(err instanceof Error ? err.message : 'No se pudo liberar el consultorio.');
    } finally {
      setAsignandoConsultorio(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2>Gestión de Citas Médicas</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {esAdminOGestor && (
              <Link to="/consultas/sin-cita" style={{ textDecoration: 'none' }}>
                <button type="button" className="button-secondary">🚶 Atención sin cita</button>
              </Link>
            )}
            {(usuario?.rol === 'ADMINISTRADOR' ||
              usuario?.rol === 'RECEPCIONISTA' ||
              usuario?.rol === 'PACIENTE') && (
              <Link to="/citas/reservar" style={{ textDecoration: 'none' }}>
                <button type="button">+ Nueva reserva</button>
              </Link>
            )}
          </div>
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
                    <td>{nombrePaciente}</td>
                    <td>{nombreMedico}</td>
                    <td>{formatearFecha(cita.fechaHoraInicio)}</td>
                    <td>{formatearFecha(cita.fechaHoraFin)}</td>
                    <td>
                      {cita.consultorio ? (
                        <span className="badge badge-confirmada" style={{ fontWeight: 600 }}>
                          🏥 {cita.consultorio.nombre}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={badgeClase(cita.estado)}>{cita.estado}</span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {puedeModificar ? (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {esAdminOGestor && (
                            <button
                              type="button"
                              className="button-secondary"
                              style={{ fontSize: '12px', padding: '6px 10px' }}
                              onClick={() => abrirModalConsultorio(cita)}
                            >
                              🏥 {cita.consultorio ? 'Reasignar' : 'Asignar'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="button-secondary"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            onClick={() => abrirModalReprogramar(cita)}
                          >
                            Reprogramar
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
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

      {citaParaConsultorio && (
        <div className="modal-overlay" onClick={() => setCitaParaConsultorio(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>Asignar Consultorio Físico</h3>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCitaParaConsultorio(null)}
              >
                Cerrar
              </button>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <p style={{ margin: '2px 0' }}>
                <strong>Cita:</strong> #{citaParaConsultorio.idCita} ({formatearFecha(citaParaConsultorio.fechaHoraInicio)} a {formatearFecha(citaParaConsultorio.fechaHoraFin)})
              </p>
              <p style={{ margin: '2px 0' }}>
                <strong>Médico:</strong> {citaParaConsultorio.medico?.usuario?.nombres} {citaParaConsultorio.medico?.usuario?.apellidos}
              </p>
              {citaParaConsultorio.consultorio && (
                <p style={{ margin: '2px 0', color: '#166534' }}>
                  <strong>Consultorio actual:</strong> {citaParaConsultorio.consultorio.nombre}
                </p>
              )}
            </div>

            <form onSubmit={handleGuardarConsultorio} className="form">
              <label className="form-field">
                <span className="label">Seleccionar Consultorio Físico:</span>
                {cargandoConsultorios ? (
                  <p>Verificando disponibilidad de consultorios...</p>
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
                        {c.nombre} (Piso {c.piso || '1'} - {c.tipo}) {c.disponible === false ? '❌ [OCUPADO EN ESTE HORARIO]' : '🟢 [DISPONIBLE]'}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {errorModalConsultorio && <p className="error">{errorModalConsultorio}</p>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                {citaParaConsultorio.consultorio ? (
                  <button
                    type="button"
                    className="button-danger"
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
                    {asignandoConsultorio ? 'Guardando...' : 'Confirmar Asignación'}
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
