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
import {
  Building2,
  Calendar,
  Search,
  RefreshCw,
  Clock,
  User,
  Tag,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  Layers,
} from 'lucide-react';

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
        <div className="page-header">
          <div>
            <h2>
              <Building2 size={22} className="text-primary" />
              <span>Gestión y Asignación de Consultorios</span>
            </h2>
            <p className="page-header-subtitle">
              Asignación de espacios físicos a profesionales médicos, control de solapamiento y consulta de disponibilidad.
            </p>
          </div>
          <button type="button" onClick={cargarDatos} className="button-secondary">
            <RefreshCw size={15} />
            <span>Actualizar</span>
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensajeExito && <div className="alert-success">{mensajeExito}</div>}

        {/* Barra de pestañas */}
        <div className="tabs" style={{ marginTop: '8px' }}>
          <button
            type="button"
            className={tab === 'calendario' ? 'active' : ''}
            onClick={() => setTab('calendario')}
          >
            <Calendar size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
            Calendario y Asignaciones
          </button>
          <button
            type="button"
            className={tab === 'disponibilidad' ? 'active' : ''}
            onClick={() => {
              setTab('disponibilidad');
              verificarDisponibilidad();
            }}
          >
            <Search size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
            Verificador de Disponibilidad
          </button>
          <button
            type="button"
            className={tab === 'catalogo' ? 'active' : ''}
            onClick={() => setTab('catalogo')}
          >
            <Building2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
            Catálogo de Consultorios ({consultorios.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CALENDARIO Y ASIGNACIONES */}
      {tab === 'calendario' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>Fecha a visualizar:</label>
              <input
                type="date"
                value={fechaCalendario}
                onChange={(e) => setFechaCalendario(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
              />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Mostrando citas y atenciones del día seleccionado
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <Clock size={32} className="empty-state-icon" />
              <p>Cargando asignaciones...</p>
            </div>
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
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '16px',
                      background: 'var(--bg-surface)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={16} className="text-primary" />
                          <span>{cons.nombre}</span>
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Piso {cons.piso || '1'} • {cons.tipo}
                        </span>
                      </div>
                      <span className={asignaciones.length > 0 ? 'badge badge-confirmada' : 'badge badge-atendida'}>
                        {asignaciones.length > 0 ? `${asignaciones.length} Ocupación(es)` : 'Libre'}
                      </span>
                    </div>

                    {asignaciones.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '14px 0' }}>
                        Sin asignaciones programadas para esta fecha.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {asignaciones.map((asig) => {
                          const medNombre = asig.medico?.usuario
                            ? `Dr(a). ${asig.medico.usuario.nombres} ${asig.medico.usuario.apellidos}`
                            : `Médico #${asig.medico?.idMedico}`;

                          const esp = asig.medico?.especialidades?.map((e) => e.nombre).join(', ') || cons.tipo;

                          return (
                            <div
                              key={asig.idCita}
                              style={{
                                background: 'var(--bg-page)',
                                borderLeft: '3px solid var(--primary)',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                border: '1px solid var(--border)',
                                borderLeftWidth: '3px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={12} />
                                  <span>{formatearHora(asig.fechaHoraInicio)} - {formatearHora(asig.fechaHoraFin)}</span>
                                </strong>
                                <span className="badge badge-confirmada" style={{ fontSize: '10px' }}>
                                  Cita #{asig.idCita}
                                </span>
                              </div>
                              <div style={{ marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <User size={13} />
                                <span>{medNombre}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Tag size={12} />
                                <span>{esp}</span>
                              </div>
                              {esAdminOGestor && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                  <button
                                    type="button"
                                    className="button-secondary button-sm"
                                    onClick={() => abrirModalAsignar(asig)}
                                  >
                                    Reasignar
                                  </button>
                                  <button
                                    type="button"
                                    className="button-outline-danger button-sm"
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
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} />
              <span>Citas pendientes de asignación de espacio físico ({citasDelDia.filter((c) => !c.consultorio).length})</span>
            </h3>
            {citasDelDia.filter((c) => !c.consultorio).length === 0 ? (
              <div className="alert-success" style={{ padding: '10px 14px' }}>
                <CheckCircle2 size={15} />
                <span>Todas las citas activas de la fecha ya cuentan con consultorio asignado.</span>
              </div>
            ) : (
              <div className="table-container">
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
                                className="button-sm"
                                onClick={() => abrirModalAsignar(c)}
                              >
                                <Building2 size={13} />
                                <span>Asignar Consultorio</span>
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
        </div>
      )}

      {/* TAB 2: VERIFICADOR DE DISPONIBILIDAD */}
      {tab === 'disponibilidad' && (
        <div className="card">
          <h3>
            <Search size={18} />
            <span>Comprobar Disponibilidad de Consultorios por Rango Horario</span>
          </h3>
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
              style={{ marginBottom: '2px' }}
            >
              <Search size={16} />
              <span>{verificandoDisp ? 'Verificando...' : 'Consultar Disponibilidad'}</span>
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            {consultoriosDisponibilidad.length === 0 ? (
              <div className="empty-state">
                <Search size={32} className="empty-state-icon" />
                <p>Presioná "Consultar Disponibilidad" para ver el estado de los consultorios.</p>
              </div>
            ) : (
              <div className="table-container">
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
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={15} className="text-primary" />
                            <strong>{c.nombre}</strong>
                          </div>
                        </td>
                        <td>{c.tipo}</td>
                        <td>Piso {c.piso || '1'}</td>
                        <td>{c.capacidad} paciente(s)</td>
                        <td>
                          <span className={c.disponible !== false ? 'badge badge-atendida' : 'badge badge-danger'}>
                            {c.disponible !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{c.disponible !== false ? 'DISPONIBLE' : 'OCUPADO EN ESTE HORARIO'}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                className={mostrarFormCrear ? 'button-secondary' : ''}
                onClick={() => {
                  setErrorCrear(null);
                  setMostrarFormCrear((v) => !v);
                }}
              >
                {mostrarFormCrear ? (
                  <>
                    <X size={15} />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Nuevo Consultorio</span>
                  </>
                )}
              </button>
            )}
          </div>

          {esAdminOGestor && mostrarFormCrear && (
            <form onSubmit={handleCrearConsultorio} className="form" style={{ marginTop: '16px', background: 'var(--bg-page)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
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

              {errorCrear && <div className="alert-error" style={{ marginTop: '8px' }}>{errorCrear}</div>}
              {especialidades.length === 0 && (
                <p className="hint">
                  No hay especialidades registradas todavía. Primero registra una especialidad para poder crear el consultorio.
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" disabled={creandoConsultorio || especialidades.length === 0}>
                  <Plus size={15} />
                  <span>{creandoConsultorio ? 'Registrando...' : 'Registrar Consultorio'}</span>
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="empty-state">
              <Clock size={32} className="empty-state-icon" />
              <p>Cargando consultorios...</p>
            </div>
          ) : consultorios.length === 0 ? (
            <div className="empty-state">
              <Building2 size={32} className="empty-state-icon" />
              <p>No hay consultorios registrados.</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: '12px' }}>
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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={15} className="text-primary" />
                          <strong>{c.nombre}</strong>
                        </div>
                      </td>
                      <td>{c.tipo}</td>
                      <td>Piso {c.piso || '1'}</td>
                      <td>{c.capacidad} paciente(s)</td>
                      <td>
                        <span className={c.activo ? 'badge badge-atendida' : 'badge badge-cancelada'}>
                          {c.activo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{c.activo ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN */}
      {citaSeleccionada && (
        <div className="modal-overlay" onClick={() => setCitaSeleccionada(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>
                <Building2 size={20} className="text-primary" />
                <span>Asignación de Consultorio Físico</span>
              </h3>
              <button
                type="button"
                className="button-secondary button-sm button-icon"
                onClick={() => setCitaSeleccionada(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '13px', background: 'var(--bg-page)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <p style={{ margin: '2px 0' }}>
                <strong>Cita:</strong> #{citaSeleccionada.idCita}
              </p>
              <p style={{ margin: '2px 0' }}>
                <strong>Médico asignado:</strong> {citaSeleccionada.medico?.usuario?.nombres} {citaSeleccionada.medico?.usuario?.apellidos} (Col. {citaSeleccionada.medico?.numeroColegiatura})
              </p>
              <p style={{ margin: '2px 0' }}>
                <strong>Fecha y Rango de Horario:</strong> {formatearFechaHora(citaSeleccionada.fechaHoraInicio)} a {formatearFechaHora(citaSeleccionada.fechaHoraFin)}
              </p>
              {citaSeleccionada.consultorio && (
                <p style={{ margin: '2px 0', color: 'var(--primary-text)', fontWeight: 600 }}>
                  Consultorio actual: {citaSeleccionada.consultorio.nombre}
                </p>
              )}
            </div>

            <form onSubmit={handleGuardarAsignacion} className="form">
              <label className="form-field">
                <span className="label">Seleccionar Consultorio Físico Disponible:</span>
                {cargandoModal ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Comprobando disponibilidad de consultorios...</p>
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
                        {c.nombre} (Piso {c.piso || '1'} - {c.tipo}) {c.disponible === false ? '[OCUPADO EN ESTE HORARIO]' : '[DISPONIBLE]'}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {errorModal && <div className="alert-error">{errorModal}</div>}

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
                  <CheckCircle2 size={16} />
                  <span>{guardandoAsignacion ? 'Guardando...' : 'Confirmar Asignación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
