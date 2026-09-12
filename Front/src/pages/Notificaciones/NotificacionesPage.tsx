import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listarNotificaciones,
  registrarEstadoNotificacion,
  type NotificacionItem,
  type EstadoNotificacion,
} from '../../services/notificacionService';
import { Bell, RefreshCw, Clock, ArrowRight } from 'lucide-react';

const TRANSICIONES_VALIDAS: Record<EstadoNotificacion, EstadoNotificacion[]> = {
  PENDIENTE: ['ENVIADA', 'FALLIDA', 'CANCELADA'],
  ENVIADA: ['FALLIDA'],
  FALLIDA: [],
  CANCELADA: [],
};

const BADGE_POR_ESTADO: Record<EstadoNotificacion, string> = {
  PENDIENTE: 'badge badge-pendiente',
  ENVIADA: 'badge badge-atendida',
  FALLIDA: 'badge badge-cancelada',
  CANCELADA: 'badge badge-cancelada',
};

export default function NotificacionesPage() {
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoNotificacion | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarDatos = async (estado?: EstadoNotificacion | '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarNotificaciones(estado ? { estado } : {});
      setNotificaciones(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos(filtroEstado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  const handleRegistrarEstado = async (notificacion: NotificacionItem, nuevoEstado: EstadoNotificacion) => {
    setError(null);
    setMensajeExito(null);
    try {
      await registrarEstadoNotificacion(notificacion.idNotificacion, nuevoEstado);
      setMensajeExito(`Notificación #${notificacion.idNotificacion} pasó a estado ${nuevoEstado}.`);
      await cargarDatos(filtroEstado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el estado de la notificación.');
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <section className="page notificaciones-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Bell size={22} className="text-primary" />
              <span>Notificaciones</span>
            </h2>
            <p className="page-header-subtitle">
              {puedeGestionar
                ? 'Estado de las notificaciones enviadas a pacientes (recordatorios de citas y avisos).'
                : 'Historial de tus notificaciones.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as EstadoNotificacion | '')}>
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ENVIADA">Enviada</option>
              <option value="FALLIDA">Fallida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <button type="button" onClick={() => cargarDatos(filtroEstado)} className="button-secondary">
              <RefreshCw size={15} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensajeExito && <div className="alert-success">{mensajeExito}</div>}

        {loading ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando notificaciones...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="empty-state">
            <Bell size={32} className="empty-state-icon" />
            <p>No hay notificaciones registradas.</p>
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Canal</th>
                  <th>Tipo</th>
                  <th>Programada</th>
                  <th>Envío</th>
                  <th>Estado</th>
                  {puedeGestionar && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {notificaciones.map((n) => (
                  <tr key={n.idNotificacion}>
                    <td><strong>#{n.idNotificacion}</strong></td>
                    <td>{n.canal}</td>
                    <td>{n.tipo}</td>
                    <td>{formatearFecha(n.fechaProgramada)}</td>
                    <td>{formatearFecha(n.fechaEnvio)}</td>
                    <td><span className={BADGE_POR_ESTADO[n.estado]}>{n.estado}</span></td>
                    {puedeGestionar && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {TRANSICIONES_VALIDAS[n.estado].length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin acciones</span>
                          ) : (
                            TRANSICIONES_VALIDAS[n.estado].map((estadoDestino) => (
                              <button
                                key={estadoDestino}
                                type="button"
                                className={estadoDestino === 'FALLIDA' || estadoDestino === 'CANCELADA' ? 'button-outline-danger button-sm' : 'button-secondary button-sm'}
                                onClick={() => handleRegistrarEstado(n, estadoDestino)}
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
