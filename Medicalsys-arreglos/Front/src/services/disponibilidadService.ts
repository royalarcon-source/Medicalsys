export interface DisponibilidadResultado {
  idHorario: number;
  idMedico: number;
  medicoNombre: string;
  numeroColegiatura: string;
  especialidades: string[];
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface RegistrarDisponibilidadPayload {
  idMedico?: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface HorarioBasico {
  idHorario: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
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

export async function registrarDisponibilidad(
  datos: RegistrarDisponibilidadPayload,
): Promise<{ mensaje: string; horario: HorarioBasico }> {
  return fetchJson('/api/disponibilidad', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function buscarDisponibilidad(filtros: {
  idMedico?: number;
  idEspecialidad?: number;
  diaSemana?: number;
}): Promise<{ resultados: DisponibilidadResultado[] }> {
  const query = new URLSearchParams();

  if (filtros.idMedico) {
    query.set('idMedico', String(filtros.idMedico));
  }

  if (filtros.idEspecialidad) {
    query.set('idEspecialidad', String(filtros.idEspecialidad));
  }

  if (filtros.diaSemana) {
    query.set('diaSemana', String(filtros.diaSemana));
  }

  return fetchJson(`/api/disponibilidad?${query.toString()}`);
}

export async function desactivarDisponibilidad(idHorario: number): Promise<{ mensaje: string }> {
  return fetchJson(`/api/disponibilidad/${idHorario}`, { method: 'DELETE' });
}
