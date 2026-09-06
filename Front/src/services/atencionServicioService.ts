import type { ServicioItem } from './facturaService';

export interface AtencionServicioItem {
  idAtencionServicio: number;
  cantidad: number;
  precioUnitario: string | number;
  subtotal: string | number;
  observaciones?: string | null;
  estado: 'PENDIENTE' | 'FACTURADO' | 'CANCELADO';
  fechaRegistro: string;
  idConsulta?: number;
  idPaciente: number;
  idServicio: number;
  idFactura?: number | null;
  servicio: ServicioItem;
  factura?: any | null;
}

export interface ItemServicioPrestadoPayload {
  idServicio: number;
  cantidad: number;
  precioUnitario?: number;
  observaciones?: string;
}

export interface RegistrarAtencionServicioPayload {
  idPaciente: number;
  idConsulta?: number;
  items: ItemServicioPrestadoPayload[];
  observacionesGenerales?: string;
}

export interface ActualizarAtencionServicioPayload {
  cantidad?: number;
  precioUnitario?: number;
  observaciones?: string;
}

export interface ResumenAtencionServicios {
  items: AtencionServicioItem[];
  totalAcumulado: number;
  totalItems: number;
  estaFacturado: boolean;
}

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data?.message || data?.error || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export async function registrarServiciosAtencion(
  payload: RegistrarAtencionServicioPayload
): Promise<{ mensaje: string; servicios: AtencionServicioItem[] }> {
  const res = await fetch('/api/atenciones-servicios', {
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

export async function actualizarServicioAtencion(
  idAtencionServicio: number,
  payload: ActualizarAtencionServicioPayload
): Promise<{ mensaje: string; servicio: AtencionServicioItem }> {
  const res = await fetch(`/api/atenciones-servicios/${idAtencionServicio}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function eliminarServicioAtencion(
  idAtencionServicio: number
): Promise<{ message: string }> {
  const res = await fetch(`/api/atenciones-servicios/${idAtencionServicio}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function listarServiciosPorConsulta(
  idConsulta: number
): Promise<ResumenAtencionServicios> {
  const res = await fetch(`/api/atenciones-servicios/consulta/${idConsulta}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function listarServiciosPorPaciente(
  idPaciente: number,
  estado?: string
): Promise<AtencionServicioItem[]> {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  const res = await fetch(`/api/atenciones-servicios/paciente/${idPaciente}${query}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
