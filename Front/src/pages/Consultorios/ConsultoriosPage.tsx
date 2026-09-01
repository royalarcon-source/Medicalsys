import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listarConsultorios,
  crearConsultorio,
  asignarConsultorioACita,
  liberarConsultorioDeCita,
  type ConsultorioItem,
} from '../../services/consultoriosService';
import { listarCitas, type CitaItem } from '../../services/citasService';
import { listarEspecialidades, type Especialidad } from '../../services/especialidadesService';

export default function ConsultoriosPage() {
  const { usuario } = useAuth();
  const esAdminOGestor =
    usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const [tab, setTab] = useState<'calendario' | 'disponibilidad' | 'catalogo'>('calendario');

  const [consultorios, setConsultorios] = useState<ConsultorioItem[]>([]);
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario de alta de consultorio
  const [mostrarFormCrear, setMostrarFormCrear] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [tipoNuevo, setTipoNuevo] = useState('');
  const [pisoNuevo, setPisoNuevo] = useState('');
  const [capacidadNuevo, setCapacidadNuevo] = useState(1);
  const [creandoConsultorio, setCreandoConsultorio] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  // Filtro de calendario por fecha
  const hoyStr = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const [fechaCalendario, setFechaCalendario] = useState<string>(hoyStr());

  // Verificador de disponibilidad
  const [fechaCheck, setFechaCheck] = useState<string>(hoyStr());
  const [horaInicioCheck, setHoraInicioCheck] = useState<string>('09:00');
  const [horaFinCheck, setHoraFinCheck] = useState<string>('10:00');
  const [consultoriosDisponibilidad, setConsultoriosDisponibilidad] = useState<ConsultorioItem[]>([]);
  const [verificandoDisp, setVerificandoDisp] = useState(false);

  // Modal de Asignación / Reasignación
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaItem | null>(null);
  const [idConsultorioModal, setIdConsultorioModal] = useState<number | ''>('');
  const [consultoriosParaModal, setConsultoriosParaModal] = useState<ConsultorioItem[]>([]);
  const [cargandoModal, setCargandoModal] = useState(false);
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resCons, resCitas, resEsp] = await Promise.all([
        listarConsultorios(),
        listarCitas(),
        listarEspecialidades(),
      ]);
      setConsultorios(resCons.consultorios || []);
      setCitas(resCitas.citas || []);
      setEspecialidades(resEsp.especialidades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de consultorios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !tipoNuevo) return;

    setCreandoConsultorio(true);
    setErrorCrear(null);

    try {
      await crearConsultorio({
        nombre: nombreNuevo.trim(),
        tipo: tipoNuevo,
        piso: pisoNuevo.trim() || undefined,
        capacidad: capacidadNuevo,
      });
      setMensajeExito(`Consultorio "${nombreNuevo.trim()}" registrado exitosamente.`);
      setNombreNuevo('');
      setTipoNuevo('');
      setPisoNuevo('');
      setCapacidadNuevo(1);
      setMostrarFormCrear(false);
      await cargarDatos();
    } catch (err) {
      setErrorCrear(err instanceof Error ? err.message : 'No se pudo registrar el consultorio.');
    } finally {
      setCreandoConsultorio(false);
    }
  };

  const verificarDisponibilidad = async () => {
    if (!fechaCheck || !horaInicioCheck || !horaFinCheck) return;
    setVerificandoDisp(true);
    setError(null);
    try {
      const res = await listarConsultorios({
        fecha: fechaCheck,
        horaInicio: horaInicioCheck,
        horaFin: horaFinCheck,
      });
      setConsultoriosDisponibilidad(res.consultorios || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar disponibilidad.');
    } finally {
      setVerificandoDisp(false);
    }
  };

  const abrirModalAsignar = async (cita: CitaItem) => {
    setCitaSeleccionada(cita);
    setIdConsultorioModal(cita.consultorio?.idConsultorio || '');
    setErrorModal(null);
    setCargandoModal(true);

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
      setConsultoriosParaModal(res.consultorios || []);
    } catch (err) {
      setErrorModal('Error al comprobar disponibilidad de consultorios para este horario.');
    } finally {
      setCargandoModal(false);
    }
  };

  const handleGuardarAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaSeleccionada || !idConsultorioModal) return;

    setGuardandoAsignacion(true);
    setErrorModal(null);

    try {
      await asignarConsultorioACita(citaSeleccionada.idCita, Number(idConsultorioModal));
      setMensajeExito(`Consultorio asignado exitosamente a la cita #${citaSeleccionada.idCita}.`);
      setCitaSeleccionada(null);
      await cargarDatos();
      if (tab === 'disponibilidad') {
        await verificarDisponibilidad();
      }
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'No se pudo asignar el consultorio.');
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const handleLiberar = async (cita: CitaItem) => {
    const confirm = window.confirm(
      `¿Deseas liberar el consultorio de la cita #${cita.idCita} asignada a ${cita.medico?.usuario?.nombres || 'médico'}?`
    );
    if (!confirm) return;

    setError(null);
    setMensajeExito(null);
    try {
      await liberarConsultorioDeCita(cita.idCita);
      setMensajeExito(`El consultorio ha sido liberado exitosamente de la cita #${cita.idCita}.`);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo liberar el consultorio.');
    }
  };

  const formatearHora = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatearFechaHora = (iso: string) => {
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

  // Filtrar citas asignadas para la fecha seleccionada en el calendario
  const citasDelDia = citas.filter((c) => {
    if (!c.fechaHoraInicio) return false;
    const d = new Date(c.fechaHoraInicio);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return fStr === fechaCalendario && c.estado !== 'CANCELADA';
  });

  return (
    <section className="page consultorios-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2>Gestión y Asignación de Consultorios</h2>
            <p className="hint">
              Asignación de espacios físicos a profesionales médicos, control de solapamiento y consulta de disponibilidad.
            </p>
          </div>
          <button type="button" onClick={cargarDatos} className="button-secondary">
            🔄 Actualizar
          </button>
        </div>

        {error && <p className="error" style={{ marginTop: '8px' }}>{error}</p>}
        {mensajeExito && <p className="success" style={{ marginTop: '8px' }}>{mensajeExito}</p>}

        {/* Barra de pestañas */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
          <button
            type="button"
            className={tab === 'calendario' ? '' : 'button-secondary'}
            onClick={() => setTab('calendario')}
          >
            📅 Calendario y Asignaciones
          </button>
          <button
            type="button"
            className={tab === 'disponibilidad' ? '' : 'button-secondary'}
            onClick={() => {
              setTab('disponibilidad');
              verificarDisponibilidad();
            }}
          >
            🔍 Verificador de Disponibilidad
          </button>
          <button
            type="button"
            className={tab === 'catalogo' ? '' : 'button-secondary'}
            onClick={() => setTab('catalogo')}
          >
            🏥 Catálogo de Consultorios ({consultorios.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CALENDARIO Y ASIGNACIONES */}
      {tab === 'calendario' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 600, fontSize: '14px' }}>Fecha a visualizar:</label>
              <input
                type="date"
                value={fechaCalendario}
                onChange={(e) => setFechaCalendario(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Mostrando citas y atenciones del día seleccionado
            </span>
          </div>

          {loading ? (
            <p>Cargando asignaciones...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {consultorios.map((cons) => {
                const asignaciones = citasDelDia.filter(
                  (c) => c.consultorio?.idConsultorio === cons.idConsultorio
                );

                return (
                  <div
                    key={cons.idConsultorio}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px',
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                          🏥 {cons.nombre}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Piso {cons.piso || '1'} • {cons.tipo}
                        </span>
                      </div>
                      <span className={asignaciones.length > 0 ? 'badge badge-confirmada' : 'badge badge-pendiente'}>
                        {asignaciones.length > 0 ? `${asignaciones.length} Ocupación(es)` : 'Libre'}
                      </span>
                    </div>

                    {asignaciones.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: '12px 0' }}>
                        Sin asignaciones programadas para esta fecha.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {asignaciones.map((asig) => {
                          const medNombre = asig.medico?.usuario
                            ? `Dr(a). ${asig.medico.usuario.nombres} ${asig.medico.usuario.apellidos}`
                            : `Médico #${asig.medico?.idMedico}`;

                          const esp = asig.medico?.especialidades?.map((e) => e.nombre).join(', ') || cons.tipo;

                          return (
                            <div
                              key={asig.idCita}
                              style={{
                                background: '#f8fafc',
                                borderLeft: '3px solid #2563eb',
                                padding: '8px 10px',
                                borderRadius: '4px',
                                fontSize: '13px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#1e293b' }}>
                                  🕒 {formatearHora(asig.fechaHoraInicio)} - {formatearHora(asig.fechaHoraFin)}
                                </strong>
                                <span className="badge badge-confirmada" style={{ fontSize: '10px' }}>
                                  Cita #{asig.idCita}
                                </span>
                              </div>
                              <div style={{ marginTop: '2px', fontWeight: 500 }}>
                                👨‍⚕️ {medNombre}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                🏷️ {esp}
                              </div>
                              {esAdminOGestor && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                  <button
                                    type="button"
                                    className="button-secondary"
                                    style={{ fontSize: '11px', padding: '3px 6px' }}
                                    onClick={() => abrirModalAsignar(asig)}
                                  >
                                    Reasignar
                                  </button>
                                  <button
                                    type="button"
                                    className="button-danger"
                                    style={{ fontSize: '11px', padding: '3px 6px' }}
                                    onClick={() => handleLiberar(asig)}
                                  >
                                    Liberar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Citas pendientes de asignación de consultorio */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>
              📋 Citas pendientes de asignación de espacio físico ({citasDelDia.filter((c) => !c.consultorio).length})
            </h3>
            {citasDelDia.filter((c) => !c.consultorio).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#166534' }}>
                ✅ Todas las citas activas de la fecha ya cuentan con consultorio asignado.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Cita</th>
                    <th>Médico</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {citasDelDia
                    .filter((c) => !c.consultorio)
                    .map((c) => (
                      <tr key={c.idCita}>
                        <td><strong>#{c.idCita}</strong></td>
                        <td>
                          {c.medico?.usuario
                            ? `Dr(a). ${c.medico.usuario.nombres} ${c.medico.usuario.apellidos}`
                            : `Médico #${c.medico?.idMedico}`}
                        </td>
                        <td>{formatearHora(c.fechaHoraInicio)} - {formatearHora(c.fechaHoraFin)}</td>
                        <td><span className="badge badge-pendiente">Sin Consultorio</span></td>
                        <td style={{ textAlign: 'right' }}>
                          {esAdminOGestor && (
                            <button
                              type="button"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              onClick={() => abrirModalAsignar(c)}
                            >
                              🏥 Asignar Consultorio
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICADOR DE DISPONIBILIDAD */}
      {tab === 'disponibilidad' && (
        <div className="card">
          <h3>Comprobar Disponibilidad de Consultorios por Rango Horario</h3>
          <p className="hint">
            Permite filtrar qué consultorios están libres para un bloque específico y evitar cruces de horarios.
          </p>

          <div className="form-row" style={{ marginTop: '12px', alignItems: 'flex-end' }}>
            <label className="form-field">
              <span className="label">Fecha:</span>
              <input
                type="date"
                value={fechaCheck}
                onChange={(e) => setFechaCheck(e.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Hora Inicio:</span>
              <input
                type="time"
                value={horaInicioCheck}
                onChange={(e) => setHoraInicioCheck(e.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Hora Fin:</span>
              <input
                type="time"
                value={horaFinCheck}
                onChange={(e) => setHoraFinCheck(e.target.value)}
                required
              />
            </label>

            <button
              type="button"
              onClick={verificarDisponibilidad}
              disabled={verificandoDisp}
              style={{ marginBottom: '8px' }}
            >
              {verificandoDisp ? 'Verificando...' : '🔍 Consultar Disponibilidad'}
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            {consultoriosDisponibilidad.length === 0 ? (
              <p>Presioná "Consultar Disponibilidad" para ver el estado de los consultorios.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Consultorio</th>
                    <th>Tipo</th>
                    <th>Piso</th>
                    <th>Capacidad</th>
                    <th>Disponibilidad ({horaInicioCheck} - {horaFinCheck})</th>
                  </tr>
                </thead>
                <tbody>
                  {consultoriosDisponibilidad.map((c) => (
                    <tr key={c.idConsultorio}>
                      <td><strong>🏥 {c.nombre}</strong></td>
                      <td>{c.tipo}</td>
                      <td>Piso {c.piso || '1'}</td>
                      <td>{c.capacidad} paciente(s)</td>
                      <td>
                        <span className={c.disponible !== false ? 'badge badge-confirmada' : 'badge badge-cancelada'}>
                          {c.disponible !== false ? '🟢 DISPONIBLE' : '🔴 OCUPADO EN ESTE HORARIO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CATÁLOGO */}
      {tab === 'catalogo' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>Catálogo General de Consultorios Registrados</h3>
            {esAdminOGestor && (
              <button
                type="button"
                onClick={() => {
                  setErrorCrear(null);
                  setMostrarFormCrear((v) => !v);
                }}
              >
                {mostrarFormCrear ? 'Cancelar' : '➕ Nuevo Consultorio'}
              </button>
            )}
          </div>

          {esAdminOGestor && mostrarFormCrear && (
            <form onSubmit={handleCrearConsultorio} className="form" style={{ marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div className="form-row">
                <label className="form-field">
                  <span className="label">Nombre:</span>
                  <input
                    type="text"
                    value={nombreNuevo}
                    onChange={(e) => setNombreNuevo(e.target.value)}
                    placeholder="Ej. Consultorio 501"
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="label">Especialidad / Tipo:</span>
                  <select value={tipoNuevo} onChange={(e) => setTipoNuevo(e.target.value)} required>
                    <option value="">-- Seleccionar especialidad --</option>
                    {especialidades.map((esp) => (
                      <option key={esp.idEspecialidad} value={esp.nombre}>
                        {esp.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="label">Piso:</span>
                  <input
                    type="text"
                    value={pisoNuevo}
                    onChange={(e) => setPisoNuevo(e.target.value)}
                    placeholder="Ej. 1"
                  />
                </label>

                <label className="form-field">
                  <span className="label">Capacidad:</span>
                  <input
                    type="number"
                    min={1}
                    value={capacidadNuevo}
                    onChange={(e) => setCapacidadNuevo(Number(e.target.value) || 1)}
                    required
                  />
                </label>
              </div>

              {errorCrear && <p className="error">{errorCrear}</p>}
              {especialidades.length === 0 && (
                <p className="hint">
                  No hay especialidades registradas todavía. Primero registra una especialidad para poder crear el consultorio.
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" disabled={creandoConsultorio || especialidades.length === 0}>
                  {creandoConsultorio ? 'Registrando...' : 'Registrar Consultorio'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p>Cargando consultorios...</p>
          ) : consultorios.length === 0 ? (
            <p className="empty-state">No hay consultorios registrados.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo / Especialidad</th>
                  <th>Piso</th>
                  <th>Capacidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {consultorios.map((c) => (
                  <tr key={c.idConsultorio}>
                    <td><strong>#{c.idConsultorio}</strong></td>
                    <td><strong>🏥 {c.nombre}</strong></td>
                    <td>{c.tipo}</td>
                    <td>Piso {c.piso || '1'}</td>
                    <td>{c.capacidad} paciente(s)</td>
                    <td>
                      <span className={c.activo ? 'badge badge-confirmada' : 'badge badge-cancelada'}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN */}
      {citaSeleccionada && (
        <div className="modal-overlay" onClick={() => setCitaSeleccionada(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>Asignación de Consultorio Físico</h3>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCitaSeleccionada(null)}
              >
                Cerrar
              </button>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <p style={{ margin: '2px 0' }}>
                <strong>Cita:</strong> #{citaSeleccionada.idCita}
              </p>
              <p style={{ margin: '2px 0' }}>
                <strong>Médico asignado:</strong> {citaSeleccionada.medico?.usuario?.nombres} {citaSeleccionada.medico?.usuario?.apellidos} (Col. {citaSeleccionada.medico?.numeroColegiatura})
              </p>
              <p style={{ margin: '2px 0' }}>
                <strong>Fecha y Rango de Horario:</strong> {formatearFechaHora(citaSeleccionada.fechaHoraInicio)} a {formatearHora(citaSeleccionada.fechaHoraFin)}
              </p>
              {citaSeleccionada.consultorio && (
                <p style={{ margin: '2px 0', color: '#166534' }}>
                  <strong>Consultorio actual:</strong> {citaSeleccionada.consultorio.nombre}
                </p>
              )}
            </div>

            <form onSubmit={handleGuardarAsignacion} className="form">
              <label className="form-field">
                <span className="label">Seleccionar Consultorio Físico Disponible:</span>
                {cargandoModal ? (
                  <p>Comprobando disponibilidad de consultorios...</p>
                ) : (
                  <select
                    value={idConsultorioModal}
                    onChange={(e) => setIdConsultorioModal(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">-- Seleccionar un consultorio --</option>
                    {consultoriosParaModal.map((c) => (
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

              {errorModal && <p className="error">{errorModal}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setCitaSeleccionada(null)}
                  disabled={guardandoAsignacion}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoAsignacion || !idConsultorioModal}>
                  {guardandoAsignacion ? 'Guardando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
