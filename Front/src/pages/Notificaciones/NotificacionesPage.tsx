import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listarNotificaciones,
  enviarWhatsApp,
  type NotificacionItem,
  type EstadoNotificacion,
} from '../../services/notificacionService';
import { Bell, RefreshCw, Clock, Search, MessageSquare } from 'lucide-react';

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
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [enviandoId, setEnviandoId] = useState<number | null>(null);

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

  // El estado de una notificación no se toca a mano: PENDIENTE → ENVIADA/FALLIDA lo decide
  // el propio envío, y CANCELADA la pone sola el backend cuando se cancela la cita. La única
  // acción manual que tiene sentido acá es disparar el envío — incluido un reenvío de una
  // que ya está ENVIADA, por si el mensaje nunca llegó de verdad (el link de wa.me no tiene
  // confirmación de entrega), con una advertencia explícita antes de reenviar.
  const handleEnviar = async (notificacion: NotificacionItem) => {
    let forzar = false;
    if (notificacion.estado === 'ENVIADA') {
      const fecha = notificacion.fechaEnvio ? formatearFecha(notificacion.fechaEnvio) : 'una fecha anterior';
      const confirmar = window.confirm(
        `Esta notificación ya está marcada como ENVIADA (${fecha}). Si el mensaje nunca llegó a WhatsApp, podés reenviarla.\n\n¿Querés reenviar el recordatorio de todas formas?`
      );
      if (!confirmar) return;
      forzar = true;
    }

    setError(null);
    setMensajeExito(null);
    setEnviandoId(notificacion.idNotificacion);
    try {
      const res = await enviarWhatsApp(notificacion.idNotificacion, forzar);
      setMensajeExito(`Recordatorio de la notificación #${notificacion.idNotificacion} ${forzar ? 'reenviado' : 'enviado'}.`);
      window.open(res.enlaceWhatsApp, '_blank');
      await cargarDatos(filtroEstado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el recordatorio.');
      await cargarDatos(filtroEstado);
    } finally {
      setEnviandoId(null);
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  // Búsqueda en cliente por paciente, motivo de la cita o ID (de la notificación o de la cita) —
  // así no hay que ir a la BD a buscar el ID de la notificación que falló.
  const notificacionesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return notificaciones;

    return notificaciones.filter((n) => {
      const nombreCompleto = `${n.usuario?.nombres ?? ''} ${n.usuario?.apellidos ?? ''}`.toLowerCase();
      const campos = [
        nombreCompleto,
        n.usuario?.email?.toLowerCase() ?? '',
        n.cita?.motivo?.toLowerCase() ?? '',
        String(n.idNotificacion),
        n.cita ? String(n.cita.idCita) : '',
      ];
      return campos.some((campo) => campo.includes(termino));
    });
  }, [notificaciones, busqueda]);

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
                ? 'El estado lo actualiza el sistema solo (al enviar o al cancelarse la cita); acá podés enviar o reintentar el WhatsApp.'
                : 'Historial de tus notificaciones.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por paciente, motivo o ID..."
                style={{ paddingLeft: '30px', minWidth: '240px' }}
              />
            </div>
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
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="empty-state">
            <Search size={32} className="empty-state-icon" />
            <p>Ninguna notificación coincide con "{busqueda}".</p>
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Cita</th>
                  <th>Canal</th>
                  <th>Programada</th>
                  <th>Envío</th>
                  <th>Estado</th>
                  {puedeGestionar && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {notificacionesFiltradas.map((n) => (
                  <tr key={n.idNotificacion}>
                    <td>
                      {n.usuario ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{n.usuario.nombres} {n.usuario.apellidos}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.usuario.email}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {n.cita ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>#{n.cita.idCita} · {formatearFecha(n.cita.fechaHoraInicio)}</span>
                          {n.cita.motivo && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.cita.motivo}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin cita</span>
                      )}
                    </td>
                    <td>{n.canal}</td>
                    <td>{formatearFecha(n.fechaProgramada)}</td>
                    <td>{formatearFecha(n.fechaEnvio)}</td>
                    <td><span className={BADGE_POR_ESTADO[n.estado]}>{n.estado}</span></td>
                    {puedeGestionar && (
                      <td style={{ textAlign: 'right' }}>
                        {n.canal === 'WHATSAPP' && n.estado !== 'CANCELADA' ? (
                          <button
                            type="button"
                            className={n.estado === 'ENVIADA' ? 'button-outline-danger button-sm' : 'button-secondary button-sm'}
                            style={n.estado === 'ENVIADA' ? undefined : { color: '#16a34a' }}
                            disabled={enviandoId === n.idNotificacion}
                            onClick={() => handleEnviar(n)}
                            title={n.estado === 'ENVIADA' ? 'Reenviar (pide confirmación: el link de WhatsApp no confirma entrega)' : undefined}
                          >
                            <MessageSquare size={13} />
                            <span>
                              {enviandoId === n.idNotificacion
                                ? 'Enviando...'
                                : n.estado === 'FALLIDA'
                                ? 'Reintentar'
                                : n.estado === 'ENVIADA'
                                ? 'Reenviar'
                                : 'Enviar'}
                            </span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {n.estado === 'CANCELADA' ? 'Cancelada con la cita' : 'Sin acciones'}
                          </span>
                        )}
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
