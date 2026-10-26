export type EstadoNotificacion = "PENDIENTE" | "ENVIADA" | "FALLIDA" | "CANCELADA";

export interface RegistrarEstadoNotificacionDTO {
  estado: EstadoNotificacion;
  motivo?: string;
}

export interface FiltroNotificacionesDTO {
  estado?: string;
  canal?: string;
  idCita?: number;
  idUsuario?: number;
}
