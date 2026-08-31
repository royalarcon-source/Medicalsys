export interface ConsultorioItem {
  idConsultorio: number;
  nombre: string;
  tipo: string;
  piso: string | null;
  capacidad: number;
  activo: boolean;
  disponible?: boolean;
}

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Ocurrió un error inesperado');
  }

  return data as T;
}

export async function listarConsultorios(filtros?: {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  excludeCitaId?: number;
}): Promise<{ consultorios: ConsultorioItem[] }> {
  const query = new URLSearchParams();
  if (filtros?.fecha) query.set('fecha', filtros.fecha);
  if (filtros?.horaInicio) query.set('horaInicio', filtros.horaInicio);
  if (filtros?.horaFin) query.set('horaFin', filtros.horaFin);
  if (filtros?.excludeCitaId) query.set('excludeCitaId', String(filtros.excludeCitaId));

  const qs = query.toString();
  return fetchJson(qs ? `/api/consultorios?${qs}` : '/api/consultorios');
}

export async function asignarConsultorioACita(
  idCita: number,
  idConsultorio: number,
): Promise<{ mensaje: string; cita: any }> {
  return fetchJson(`/api/citas/${idCita}/asignar-consultorio`, {
    method: 'PATCH',
    body: JSON.stringify({ idConsultorio }),
  });
}

export async function liberarConsultorioDeCita(
  idCita: number,
): Promise<{ mensaje: string; cita: any }> {
  return fetchJson(`/api/citas/${idCita}/consultorio`, {
    method: 'DELETE',
  });
}
