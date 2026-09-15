export type EstadoNotificacion = 'PENDIENTE' | 'ENVIADA' | 'FALLIDA' | 'CANCELADA';

export interface NotificacionUsuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface NotificacionCita {
  idCita: number;
  fechaHoraInicio: string;
  motivo: string | null;
}

export interface NotificacionItem {
  idNotificacion: number;
  canal: 'WHATSAPP' | 'EMAIL' | 'SMS';
  tipo: string;
  mensaje: string;
  estado: EstadoNotificacion;
  fechaProgramada: string | null;
  fechaEnvio: string | null;
  usuario: NotificacionUsuario;
  cita: NotificacionCita | null;
}

export interface FiltrosNotificaciones {
  estado?: EstadoNotificacion;
  canal?: string;
  idCita?: number;
}

export interface EnviarWhatsAppResponse {
  mensaje: string;
  notificacion: NotificacionItem;
  telefonoDestino: string;
  enlaceWhatsApp: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data?.message || data?.error || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export async function listarNotificaciones(filtros: FiltrosNotificaciones = {}): Promise<NotificacionItem[]> {
  const params = new URLSearchParams();
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.canal) params.set('canal', filtros.canal);
  if (filtros.idCita) params.set('idCita', String(filtros.idCita));

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/notificaciones${queryStr}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.notificaciones;
}

export async function obtenerNotificacionesPorCita(idCita: number): Promise<NotificacionItem[]> {
  const res = await fetch(`/api/notificaciones/cita/${idCita}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// `forzar` reenvía una notificación que ya está ENVIADA (el usuario confirmó que en
// realidad no llegó). Sin `forzar`, el backend rechaza con 409 si ya está ENVIADA.
export async function enviarWhatsApp(idNotificacion: number, forzar = false): Promise<EnviarWhatsAppResponse> {
  const res = await fetch(`/api/notificaciones/${idNotificacion}/enviar-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ forzar }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// HU-36: registrar (actualizar) el estado de una notificación
export async function registrarEstadoNotificacion(
  idNotificacion: number,
  estado: EstadoNotificacion,
  motivo?: string
): Promise<{ mensaje: string; notificacion: NotificacionItem }> {
  const res = await fetch(`/api/notificaciones/${idNotificacion}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ estado, motivo }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
