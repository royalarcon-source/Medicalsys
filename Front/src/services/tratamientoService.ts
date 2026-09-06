export interface TratamientoPayload {
  idConsulta: number;
  descripcion: string;
  indicaciones?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface TratamientoItem {
  idTratamiento: number;
  descripcion: string;
  indicaciones?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  consulta?: {
    idConsulta: number;
    motivo?: string | null;
    medico?: {
      idMedico: number;
      usuario?: {
        nombres: string;
        apellidos: string;
      };
    };
    historia?: {
      idHistoria: number;
      paciente?: {
        idPaciente: number;
        usuario?: {
          nombres: string;
          apellidos: string;
        };
      };
    };
  };
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

export async function listarTratamientos(): Promise<{ tratamientos: TratamientoItem[] }> {
  return fetchJson('/api/tratamientos');
}

export async function obtenerTratamientoPorId(idTratamiento: number): Promise<{ tratamiento: TratamientoItem }> {
  return fetchJson(`/api/tratamientos/${idTratamiento}`);
}

export async function registrarTratamiento(
  datos: TratamientoPayload,
): Promise<{ mensaje: string; tratamiento: TratamientoItem }> {
  return fetchJson('/api/tratamientos', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}
