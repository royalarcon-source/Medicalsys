import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listarAnuncios,
  crearAnuncio,
  cambiarEstadoAnuncio,
  type AnuncioItem,
  type EstadoAnuncio,
} from '../../services/anuncioService';
import { Newspaper, Plus, X, RefreshCw, Clock, ArrowRight, Eye } from 'lucide-react';

type Periodo = 'hoy' | 'semana' | 'mes' | 'todos';

const TRANSICIONES_VALIDAS: Record<EstadoAnuncio, EstadoAnuncio[]> = {
  BORRADOR: ['PUBLICADO', 'ARCHIVADO'],
  PUBLICADO: ['ARCHIVADO'],
  ARCHIVADO: [],
};

const BADGE_POR_ESTADO: Record<EstadoAnuncio, string> = {
  BORRADOR: 'badge badge-pendiente',
  PUBLICADO: 'badge badge-atendida',
  ARCHIVADO: 'badge badge-cancelada',
};

// Comparaciones por string "YYYY-MM-DD" (así llega fechaPublicacion del backend) en vez de
// construir objetos Date, para no repetir el desfase de huso horario que ya se documentó
// para Campaña/Promoción (HU-32/33) con columnas "date".
function hoyYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function inicioYFinDeSemana(): [string, string] {
  const d = new Date();
  const dia = d.getDay(); // 0 = domingo
  const diffInicio = dia === 0 ? 6 : dia - 1; // semana de lunes a domingo
  const inicio = new Date(d);
  inicio.setDate(d.getDate() - diffInicio);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  const fmt = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return [fmt(inicio), fmt(fin)];
}

export default function AnunciosPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  const [anuncios, setAnuncios] = useState<AnuncioItem[]>([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState<Periodo>('mes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [anuncioSeleccionado, setAnuncioSeleccionado] = useState<AnuncioItem | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarAnuncios(esAdmin ? { todos: true } : {});
      setAnuncios(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los anuncios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtro por período (hoy/semana/mes) para no tener que revisar todo el historial —
  // sobre todo pensado para el paciente, que solo quiere ver lo reciente. Un anuncio sin
  // fechaPublicacion (BORRADOR, solo lo ve el administrador) se muestra siempre: todavía
  // no tiene una fecha de publicación con la cual filtrar.
  const anunciosFiltrados = useMemo(() => {
    if (filtroPeriodo === 'todos') return anuncios;

    const hoy = hoyYYYYMMDD();
    const [inicioSemana, finSemana] = inicioYFinDeSemana();

    return anuncios.filter((a) => {
      if (!a.fechaPublicacion) return true;
      if (filtroPeriodo === 'hoy') return a.fechaPublicacion === hoy;
      if (filtroPeriodo === 'semana') return a.fechaPublicacion >= inicioSemana && a.fechaPublicacion <= finSemana;
      return a.fechaPublicacion.slice(0, 7) === hoy.slice(0, 7); // 'mes'
    });
  }, [anuncios, filtroPeriodo]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    setCreando(true);
    setErrorForm(null);
    try {
      await crearAnuncio({
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        fechaExpiracion: fechaExpiracion || undefined,
      });
      setMensajeExito(`Anuncio "${titulo.trim()}" creado como borrador.`);
      setTitulo('');
      setContenido('');
      setFechaExpiracion('');
      setMostrarForm(false);
      await cargarDatos();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo crear el anuncio.');
    } finally {
      setCreando(false);
    }
  };

  const handleCambiarEstado = async (anuncio: AnuncioItem, nuevoEstado: EstadoAnuncio) => {
    setError(null);
    setMensajeExito(null);
    try {
      await cambiarEstadoAnuncio(anuncio.idAnuncio, nuevoEstado);
      setMensajeExito(`Anuncio "${anuncio.titulo}" pasó a estado ${nuevoEstado}.`);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del anuncio.');
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <section className="page anuncios-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Newspaper size={22} className="text-primary" />
              <span>Zona de Anuncios</span>
            </h2>
            <p className="page-header-subtitle">
              Comunicados y avisos generales del centro médico para pacientes y personal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value as Periodo)}>
              <option value="hoy">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="todos">Todos</option>
            </select>
            <button type="button" onClick={cargarDatos} className="button-secondary">
              <RefreshCw size={15} />
              <span>Actualizar</span>
            </button>
            {esAdmin && (
              <button
                type="button"
                className={mostrarForm ? 'button-secondary' : ''}
                onClick={() => {
                  setErrorForm(null);
                  setMostrarForm((v) => !v);
                }}
              >
                {mostrarForm ? (
                  <>
                    <X size={15} />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Nuevo Anuncio</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensajeExito && <div className="alert-success">{mensajeExito}</div>}

        {esAdmin && mostrarForm && (
          <form onSubmit={handleCrear} className="form" style={{ marginTop: '16px', background: 'var(--bg-page)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div className="form-row">
              <label className="form-field">
                <span className="label">Título:</span>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Horario especial por feriado"
                  maxLength={150}
                  required
                />
              </label>

              <label className="form-field">
                <span className="label">Fecha de expiración (opcional):</span>
                <input
                  type="date"
                  value={fechaExpiracion}
                  onChange={(e) => setFechaExpiracion(e.target.value)}
                />
              </label>
            </div>

            <label className="form-field">
              <span className="label">Contenido:</span>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Detalle del anuncio"
                rows={3}
                required
              />
            </label>

            {errorForm && <div className="alert-error" style={{ marginTop: '8px' }}>{errorForm}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="submit" disabled={creando}>
                <Plus size={15} />
                <span>{creando ? 'Creando...' : 'Crear Anuncio'}</span>
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando anuncios...</p>
          </div>
        ) : anuncios.length === 0 ? (
          <div className="empty-state">
            <Newspaper size={32} className="empty-state-icon" />
            <p>No hay anuncios publicados por el momento.</p>
          </div>
        ) : anunciosFiltrados.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>No hay anuncios en el período seleccionado.</p>
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Publicación</th>
                  <th>Expiración</th>
                  <th>Estado</th>
                  {esAdmin && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {anunciosFiltrados.map((a) => (
                  <tr
                    key={a.idAnuncio}
                    onClick={() => setAnuncioSeleccionado(a)}
                    style={{ cursor: 'pointer' }}
                    title="Ver anuncio completo"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={13} style={{ color: 'var(--text-muted)' }} />
                        <strong>{a.titulo}</strong>
                      </div>
                    </td>
                    <td>{formatearFecha(a.fechaPublicacion)}</td>
                    <td>{formatearFecha(a.fechaExpiracion)}</td>
                    <td><span className={BADGE_POR_ESTADO[a.estado]}>{a.estado}</span></td>
                    {esAdmin && (
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {TRANSICIONES_VALIDAS[a.estado].length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin acciones</span>
                          ) : (
                            TRANSICIONES_VALIDAS[a.estado].map((estadoDestino) => (
                              <button
                                key={estadoDestino}
                                type="button"
                                className={estadoDestino === 'ARCHIVADO' ? 'button-outline-danger button-sm' : 'button-secondary button-sm'}
                                onClick={() => handleCambiarEstado(a, estadoDestino)}
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

      {/* Tarjeta con el detalle completo del anuncio */}
      {anuncioSeleccionado && (
        <div className="modal-overlay" onClick={() => setAnuncioSeleccionado(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>
                <Newspaper size={20} className="text-primary" />
                <span>{anuncioSeleccionado.titulo}</span>
              </h3>
              <button
                type="button"
                className="button-secondary button-sm button-icon"
                onClick={() => setAnuncioSeleccionado(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span className={BADGE_POR_ESTADO[anuncioSeleccionado.estado]}>{anuncioSeleccionado.estado}</span>
            </div>

            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>{anuncioSeleccionado.contenido}</p>

            <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>Publicado: {formatearFecha(anuncioSeleccionado.fechaPublicacion)}</span>
              <span>Expira: {formatearFecha(anuncioSeleccionado.fechaExpiracion)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
