export interface RegistrarMedicoPayload {
  idUsuario: number;
  numeroColegiatura: string;
}

export interface MedicoRegistrado {
  idMedico: number;
  numeroColegiatura: string;
  activo: boolean;
}

export interface MedicoDetalle {
  idMedico: number;
  numeroColegiatura: string;
  activo: boolean;
  usuario: { nombres: string; apellidos: string; email: string };
  especialidades: { idEspecialidad: number; nombre: string; descripcion: string | null }[];
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

export async function crearMedico(
  datos: RegistrarMedicoPayload,
): Promise<{ mensaje: string; medico: MedicoRegistrado }> {
  return fetchJson('/api/medicos', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function obtenerMedico(idMedico: number): Promise<{ medico: MedicoDetalle }> {
  return fetchJson(`/api/medicos/${idMedico}`);
}
