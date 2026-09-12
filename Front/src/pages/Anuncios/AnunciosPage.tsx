import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listarAnuncios,
  crearAnuncio,
  cambiarEstadoAnuncio,
  type AnuncioItem,
  type EstadoAnuncio,
} from '../../services/anuncioService';
import { Newspaper, Plus, X, RefreshCw, Clock, ArrowRight } from 'lucide-react';

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

export default function AnunciosPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  const [anuncios, setAnuncios] = useState<AnuncioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

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
          <div style={{ display: 'flex', gap: '8px' }}>
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
        ) : (
          <div className="table-container" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Publicación</th>
                  <th>Expiración</th>
                  <th>Estado</th>
                  {esAdmin && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {anuncios.map((a) => (
                  <tr key={a.idAnuncio}>
                    <td><strong>#{a.idAnuncio}</strong></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{a.titulo}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.contenido}</span>
                      </div>
                    </td>
                    <td>{formatearFecha(a.fechaPublicacion)}</td>
                    <td>{formatearFecha(a.fechaExpiracion)}</td>
                    <td><span className={BADGE_POR_ESTADO[a.estado]}>{a.estado}</span></td>
                    {esAdmin && (
                      <td style={{ textAlign: 'right' }}>
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
    </section>
  );
}
