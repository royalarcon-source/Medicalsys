export type EstadoCampana = 'BORRADOR' | 'PROGRAMADA' | 'ACTIVA' | 'FINALIZADA' | 'CANCELADA';

export interface CampanaItem {
  idCampana: number;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoCampana;
}

export interface PromocionItem {
  idPromocion: number;
  nombre: string;
  descripcion: string | null;
  porcentajeDesc: string | number | null;
  fechaInicio: string;
  fechaFin: string | null;
  activa: boolean;
  campana?: CampanaItem;
}

export interface FiltrosCampanas {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface FiltrosPromociones {
  idCampana?: number;
  activa?: boolean;
  vigente?: boolean;
}

export interface CrearCampanaPayload {
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
}

export interface CrearPromocionPayload {
  idCampana: number;
  nombre: string;
  descripcion?: string;
  porcentajeDesc?: number;
  fechaInicio: string;
  fechaFin?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data?.message || data?.error || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export async function listarCampanas(filtros: FiltrosCampanas = {}): Promise<CampanaItem[]> {
  const params = new URLSearchParams();
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.fechaInicio) params.set('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) params.set('fechaFin', filtros.fechaFin);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/campanas${queryStr}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.campanas;
}

export async function crearCampana(payload: CrearCampanaPayload): Promise<{ mensaje: string; campana: CampanaItem }> {
  const res = await fetch('/api/campanas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function cambiarEstadoCampana(id: number, estado: EstadoCampana): Promise<{ mensaje: string; campana: CampanaItem }> {
  const res = await fetch(`/api/campanas/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function listarPromociones(filtros: FiltrosPromociones = {}): Promise<PromocionItem[]> {
  const params = new URLSearchParams();
  if (filtros.idCampana) params.set('idCampana', String(filtros.idCampana));
  if (filtros.activa !== undefined) params.set('activa', String(filtros.activa));
  if (filtros.vigente) params.set('vigente', 'true');

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/promociones${queryStr}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.promociones;
}

export async function crearPromocion(payload: CrearPromocionPayload): Promise<{ mensaje: string; promocion: PromocionItem }> {
  const res = await fetch('/api/promociones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function cambiarEstadoPromocion(id: number, activa: boolean): Promise<{ mensaje: string; promocion: PromocionItem }> {
  const res = await fetch(`/api/promociones/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ activa }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
