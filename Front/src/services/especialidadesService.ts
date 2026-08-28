export interface Especialidad {
  idEspecialidad: number;
  nombre: string;
  descripcion: string | null;
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

export async function listarEspecialidades(): Promise<{ especialidades: Especialidad[] }> {
  return fetchJson('/api/especialidades');
}

export async function asignarEspecialidades(
  idMedico: number,
  idEspecialidades: number[],
): Promise<{ mensaje: string }> {
  return fetchJson(`/api/especialidades/medicos/${idMedico}/especialidades`, {
    method: 'PUT',
    body: JSON.stringify({ idEspecialidades }),
  });
}
