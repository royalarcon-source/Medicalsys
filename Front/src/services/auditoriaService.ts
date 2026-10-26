export interface AuditLog {
  idLog: number;
  idUsuario: number | null;
  rol: string | null;
  accion: string;
  entidad: string | null;
  idEntidad: number | null;
  ip: string | null;
  userAgent: string | null;
  resultado: 'EXITO' | 'ERROR' | 'ACCESO_DENEGADO';
  detalle: string | null;
  fechaHora: string;
}

export interface ListarAuditResponse {
  total: number;
  registros: AuditLog[];
}

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data?.message || data?.error || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export const auditoriaService = {
  async listar(filtros: { accion?: string; resultado?: string; page?: number; limit?: number } = {}): Promise<ListarAuditResponse> {
    const params = new URLSearchParams();
    if (filtros.accion) params.append('accion', filtros.accion);
    if (filtros.resultado) params.append('resultado', filtros.resultado);
    if (filtros.page) params.append('page', String(filtros.page));
    if (filtros.limit) params.append('limit', String(filtros.limit));

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/auditoria${query}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },
};
