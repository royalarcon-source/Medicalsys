export interface ServicioItem {
  idServicio: number;
  nombre: string;
  descripcion: string | null;
  precio: string | number;
  activo: boolean;
}

export interface DetalleFacturaItem {
  idDetalle?: number;
  idServicio: number;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: string | number;
  servicio?: ServicioItem;
}

export interface FacturaItem {
  idFactura: number;
  numeroFactura: string;
  fechaEmision: string;
  nitCliente: string;
  razonSocial: string;
  subtotal: string | number;
  impuestos: string | number;
  total: string | number;
  estado: 'BORRADOR' | 'EMITIDA' | 'PAGADA' | 'ANULADA';
  codigoControl: string | null;
  paciente?: {
    idPaciente: number;
    documentoIdentidad: string;
    usuario?: {
      idUsuario: number;
      nombres: string;
      apellidos: string;
      email: string;
      telefono?: string;
    };
  };
  detalles?: DetalleFacturaItem[];
}

export interface EmitirFacturaPayload {
  idPaciente: number;
  nitCliente?: string;
  razonSocial?: string;
  items: {
    idServicio: number;
    cantidad: number;
    precioUnitario?: number;
  }[];
  descuento?: number;
  porcentajeDescuento?: number;
  estado?: 'EMITIDA' | 'PAGADA';
  idConsulta?: number;
}

export interface FiltrosFactura {
  idPaciente?: number;
  nitCliente?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
}

export interface PendienteFacturacion {
  idConsulta: number;
  fecha: string;
  motivo: string;
  medico: string;
  especialidad: string;
  serviciosRegistrados?: {
    idAtencionServicio: number;
    idServicio: number;
    nombre: string;
    precioUnitario: number;
    cantidad: number;
    subtotal: number;
    observaciones?: string;
  }[];
  totalServiciosRegistrados?: number;
  servicioSugerido: {
    idServicio: number;
    nombre: string;
    precio: number;
  } | null;
}

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data?.message || data?.error || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export async function listarServicios(): Promise<ServicioItem[]> {
  const res = await fetch('/api/servicios', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function crearServicio(datos: { nombre: string; descripcion?: string; precio: number }): Promise<ServicioItem> {
  const res = await fetch('/api/servicios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function emitirFactura(payload: EmitirFacturaPayload): Promise<{ mensaje: string; factura: FacturaItem }> {
  const res = await fetch('/api/facturas', {
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

export async function listarFacturas(filtros: FiltrosFactura = {}): Promise<FacturaItem[]> {
  const params = new URLSearchParams();
  if (filtros.idPaciente) params.set('idPaciente', String(filtros.idPaciente));
  if (filtros.nitCliente) params.set('nitCliente', filtros.nitCliente);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.fechaInicio) params.set('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) params.set('fechaFin', filtros.fechaFin);
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/facturas${queryStr}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function obtenerFacturaPorId(id: number): Promise<FacturaItem> {
  const res = await fetch(`/api/facturas/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function obtenerPendientesDeFacturacion(idPaciente: number): Promise<PendienteFacturacion[]> {
  const res = await fetch(`/api/facturas/pacientes/${idPaciente}/pendientes`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

