import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listarCampanas,
  crearCampana,
  cambiarEstadoCampana,
  listarPromociones,
  crearPromocion,
  cambiarEstadoPromocion,
  type CampanaItem,
  type PromocionItem,
  type EstadoCampana,
} from '../../services/marketingService';
import {
  Megaphone,
  Tag,
  Plus,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

const TRANSICIONES_VALIDAS: Record<EstadoCampana, EstadoCampana[]> = {
  BORRADOR: ['PROGRAMADA', 'CANCELADA'],
  PROGRAMADA: ['ACTIVA', 'CANCELADA'],
  ACTIVA: ['FINALIZADA', 'CANCELADA'],
  FINALIZADA: [],
  CANCELADA: [],
};

const BADGE_POR_ESTADO: Record<EstadoCampana, string> = {
  BORRADOR: 'badge badge-pendiente',
  PROGRAMADA: 'badge badge-confirmada',
  ACTIVA: 'badge badge-atendida',
  FINALIZADA: 'badge badge-atendida',
  CANCELADA: 'badge badge-cancelada',
};

export default function MarketingPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  const [tab, setTab] = useState<'campanas' | 'promociones'>('campanas');

  const [campanas, setCampanas] = useState<CampanaItem[]>([]);
  const [promociones, setPromociones] = useState<PromocionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario de campaña
  const [mostrarFormCampana, setMostrarFormCampana] = useState(false);
  const [nombreCampana, setNombreCampana] = useState('');
  const [descripcionCampana, setDescripcionCampana] = useState('');
  const [fechaInicioCampana, setFechaInicioCampana] = useState('');
  const [fechaFinCampana, setFechaFinCampana] = useState('');
  const [creandoCampana, setCreandoCampana] = useState(false);
  const [errorCampana, setErrorCampana] = useState<string | null>(null);

  // Formulario de promoción
  const [mostrarFormPromocion, setMostrarFormPromocion] = useState(false);
  const [idCampanaPromocion, setIdCampanaPromocion] = useState<number | ''>('');
  const [nombrePromocion, setNombrePromocion] = useState('');
  const [descripcionPromocion, setDescripcionPromocion] = useState('');
  const [porcentajePromocion, setPorcentajePromocion] = useState<number | ''>('');
  const [fechaInicioPromocion, setFechaInicioPromocion] = useState('');
  const [fechaFinPromocion, setFechaFinPromocion] = useState('');
  const [creandoPromocion, setCreandoPromocion] = useState(false);
  const [errorPromocion, setErrorPromocion] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resCampanas, resPromociones] = await Promise.all([listarCampanas(), listarPromociones()]);
      setCampanas(resCampanas || []);
      setPromociones(resPromociones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar campañas y promociones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearCampana = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCampana.trim() || !fechaInicioCampana) return;

    setCreandoCampana(true);
    setErrorCampana(null);
    try {
      await crearCampana({
        nombre: nombreCampana.trim(),
        descripcion: descripcionCampana.trim() || undefined,
        fechaInicio: fechaInicioCampana,
        fechaFin: fechaFinCampana || undefined,
      });
      setMensajeExito(`Campaña "${nombreCampana.trim()}" creada exitosamente.`);
      setNombreCampana('');
      setDescripcionCampana('');
      setFechaInicioCampana('');
      setFechaFinCampana('');
      setMostrarFormCampana(false);
      await cargarDatos();
    } catch (err) {
      setErrorCampana(err instanceof Error ? err.message : 'No se pudo crear la campaña.');
    } finally {
      setCreandoCampana(false);
    }
  };

  const handleCambiarEstadoCampana = async (campana: CampanaItem, nuevoEstado: EstadoCampana) => {
    setError(null);
    setMensajeExito(null);
    try {
      await cambiarEstadoCampana(campana.idCampana, nuevoEstado);
      setMensajeExito(`Campaña "${campana.nombre}" pasó a estado ${nuevoEstado}.`);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la campaña.');
    }
  };

  const handleCrearPromocion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCampanaPromocion || !nombrePromocion.trim() || !fechaInicioPromocion) return;

    setCreandoPromocion(true);
    setErrorPromocion(null);
    try {
      await crearPromocion({
        idCampana: Number(idCampanaPromocion),
        nombre: nombrePromocion.trim(),
        descripcion: descripcionPromocion.trim() || undefined,
        porcentajeDesc: porcentajePromocion === '' ? undefined : Number(porcentajePromocion),
        fechaInicio: fechaInicioPromocion,
        fechaFin: fechaFinPromocion || undefined,
      });
      setMensajeExito(`Promoción "${nombrePromocion.trim()}" creada exitosamente.`);
      setIdCampanaPromocion('');
      setNombrePromocion('');
      setDescripcionPromocion('');
      setPorcentajePromocion('');
      setFechaInicioPromocion('');
      setFechaFinPromocion('');
      setMostrarFormPromocion(false);
      await cargarDatos();
    } catch (err) {
      setErrorPromocion(err instanceof Error ? err.message : 'No se pudo crear la promoción.');
    } finally {
      setCreandoPromocion(false);
    }
  };

  const handleToggleActivaPromocion = async (promocion: PromocionItem) => {
    setError(null);
    setMensajeExito(null);
    try {
      await cambiarEstadoPromocion(promocion.idPromocion, !promocion.activa);
      setMensajeExito(`Promoción "${promocion.nombre}" ${promocion.activa ? 'desactivada' : 'activada'} exitosamente.`);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la promoción.');
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <section className="page marketing-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Megaphone size={22} className="text-primary" />
              <span>Zona de Anuncios — Campañas y Promociones</span>
            </h2>
            <p className="page-header-subtitle">
              Campañas preventivas, de salud y de fidelización de pacientes, con sus promociones asociadas.
            </p>
          </div>
          <button type="button" onClick={cargarDatos} className="button-secondary">
            <RefreshCw size={15} />
            <span>Actualizar</span>
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensajeExito && <div className="alert-success">{mensajeExito}</div>}

        <div className="tabs" style={{ marginTop: '8px' }}>
          <button type="button" className={tab === 'campanas' ? 'active' : ''} onClick={() => setTab('campanas')}>
            <Megaphone size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
            Campañas ({campanas.length})
          </button>
          <button type="button" className={tab === 'promociones' ? 'active' : ''} onClick={() => setTab('promociones')}>
            <Tag size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
            Promociones ({promociones.length})
          </button>
        </div>
      </div>

      {/* TAB CAMPAÑAS */}
      {tab === 'campanas' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>Campañas registradas</h3>
            {esAdmin && (
              <button
                type="button"
                className={mostrarFormCampana ? 'button-secondary' : ''}
                onClick={() => {
                  setErrorCampana(null);
                  setMostrarFormCampana((v) => !v);
                }}
              >
                {mostrarFormCampana ? (
                  <>
                    <X size={15} />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Nueva Campaña</span>
                  </>
                )}
              </button>
            )}
          </div>

          {esAdmin && mostrarFormCampana && (
            <form onSubmit={handleCrearCampana} className="form" style={{ marginTop: '16px', background: 'var(--bg-page)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div className="form-row">
                <label className="form-field">
                  <span className="label">Nombre:</span>
                  <input
                    type="text"
                    value={nombreCampana}
                    onChange={(e) => setNombreCampana(e.target.value)}
                    placeholder="Ej. Campaña de Vacunación 2026"
                    maxLength={150}
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="label">Fecha de inicio:</span>
                  <input
                    type="date"
                    value={fechaInicioCampana}
                    onChange={(e) => setFechaInicioCampana(e.target.value)}
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="label">Fecha de fin (opcional):</span>
                  <input
                    type="date"
                    value={fechaFinCampana}
                    onChange={(e) => setFechaFinCampana(e.target.value)}
                  />
                </label>
              </div>

              <label className="form-field">
                <span className="label">Descripción (opcional):</span>
                <textarea
                  value={descripcionCampana}
                  onChange={(e) => setDescripcionCampana(e.target.value)}
                  placeholder="Detalle de la campaña"
                  rows={2}
                />
              </label>

              {errorCampana && <div className="alert-error" style={{ marginTop: '8px' }}>{errorCampana}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" disabled={creandoCampana}>
                  <Plus size={15} />
                  <span>{creandoCampana ? 'Creando...' : 'Crear Campaña'}</span>
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="empty-state">
              <Clock size={32} className="empty-state-icon" />
              <p>Cargando campañas...</p>
            </div>
          ) : campanas.length === 0 ? (
            <div className="empty-state">
              <Megaphone size={32} className="empty-state-icon" />
              <p>No hay campañas registradas.</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: '12px' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    {esAdmin && <th style={{ textAlign: 'right' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {campanas.map((c) => (
                    <tr key={c.idCampana}>
                      <td><strong>#{c.idCampana}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{c.nombre}</strong>
                          {c.descripcion && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.descripcion}</span>
                          )}
                        </div>
                      </td>
                      <td>{formatearFecha(c.fechaInicio)} — {formatearFecha(c.fechaFin)}</td>
                      <td><span className={BADGE_POR_ESTADO[c.estado]}>{c.estado}</span></td>
                      {esAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {TRANSICIONES_VALIDAS[c.estado].length === 0 ? (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin acciones</span>
                            ) : (
                              TRANSICIONES_VALIDAS[c.estado].map((estadoDestino) => (
                                <button
                                  key={estadoDestino}
                                  type="button"
                                  className={estadoDestino === 'CANCELADA' ? 'button-outline-danger button-sm' : 'button-secondary button-sm'}
                                  onClick={() => handleCambiarEstadoCampana(c, estadoDestino)}
                                >
                                  <ArrowRight size={13} />
                                  <span>{estadoDestino}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB PROMOCIONES */}
      {tab === 'promociones' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>Promociones registradas</h3>
            {esAdmin && (
              <button
                type="button"
                className={mostrarFormPromocion ? 'button-secondary' : ''}
                onClick={() => {
                  setErrorPromocion(null);
                  setMostrarFormPromocion((v) => !v);
                }}
              >
                {mostrarFormPromocion ? (
                  <>
                    <X size={15} />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Nueva Promoción</span>
                  </>
                )}
              </button>
            )}
          </div>

          {esAdmin && mostrarFormPromocion && (
            <form onSubmit={handleCrearPromocion} className="form" style={{ marginTop: '16px', background: 'var(--bg-page)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div className="form-row">
                <label className="form-field">
                  <span className="label">Campaña:</span>
                  <select
                    value={idCampanaPromocion}
                    onChange={(e) => setIdCampanaPromocion(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">-- Seleccionar campaña --</option>
                    {campanas.map((c) => (
                      <option key={c.idCampana} value={c.idCampana}>
                        {c.nombre} ({c.estado})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="label">Nombre:</span>
                  <input
                    type="text"
                    value={nombrePromocion}
                    onChange={(e) => setNombrePromocion(e.target.value)}
                    placeholder="Ej. 20% de descuento en chequeo preventivo"
                    maxLength={150}
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="label">% de descuento (opcional):</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={porcentajePromocion}
                    onChange={(e) => setPorcentajePromocion(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 20"
                  />
                </label>
              </div>

              <div className="form-row">
                <label className="form-field">
                  <span className="label">Fecha de inicio:</span>
                  <input
                    type="date"
                    value={fechaInicioPromocion}
                    onChange={(e) => setFechaInicioPromocion(e.target.value)}
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="label">Fecha de fin (opcional):</span>
                  <input
                    type="date"
                    value={fechaFinPromocion}
                    onChange={(e) => setFechaFinPromocion(e.target.value)}
                  />
                </label>
              </div>

              <label className="form-field">
                <span className="label">Descripción (opcional):</span>
                <textarea
                  value={descripcionPromocion}
                  onChange={(e) => setDescripcionPromocion(e.target.value)}
                  placeholder="Detalle de la promoción"
                  rows={2}
                />
              </label>

              {errorPromocion && <div className="alert-error" style={{ marginTop: '8px' }}>{errorPromocion}</div>}
              {campanas.length === 0 && (
                <p className="hint">No hay campañas registradas todavía. Primero crea una campaña para poder asociarle una promoción.</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" disabled={creandoPromocion || campanas.length === 0}>
                  <Plus size={15} />
                  <span>{creandoPromocion ? 'Creando...' : 'Crear Promoción'}</span>
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="empty-state">
              <Clock size={32} className="empty-state-icon" />
              <p>Cargando promociones...</p>
            </div>
          ) : promociones.length === 0 ? (
            <div className="empty-state">
              <Tag size={32} className="empty-state-icon" />
              <p>No hay promociones registradas.</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: '12px' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Campaña</th>
                    <th>Descuento</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    {esAdmin && <th style={{ textAlign: 'right' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {promociones.map((p) => (
                    <tr key={p.idPromocion}>
                      <td><strong>#{p.idPromocion}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{p.nombre}</strong>
                          {p.descripcion && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.descripcion}</span>
                          )}
                        </div>
                      </td>
                      <td>{p.campana?.nombre || `#${(p as any).idCampana ?? '—'}`}</td>
                      <td>{p.porcentajeDesc !== null && p.porcentajeDesc !== undefined ? `${p.porcentajeDesc}%` : '—'}</td>
                      <td>{formatearFecha(p.fechaInicio)} — {formatearFecha(p.fechaFin)}</td>
                      <td>
                        <span className={p.activa ? 'badge badge-atendida' : 'badge badge-cancelada'}>
                          {p.activa ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{p.activa ? 'Activa' : 'Inactiva'}</span>
                        </span>
                      </td>
                      {esAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={p.activa ? 'button-outline-danger button-sm' : 'button-secondary button-sm'}
                            onClick={() => handleToggleActivaPromocion(p)}
                          >
                            {p.activa ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
