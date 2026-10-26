export interface DiagnosticoPayload {
  idConsulta: number;
  codigo?: string;
  descripcion: string;
  tipo?: string;
}

export interface DiagnosticoItem {
  idDiagnostico: number;
  codigo?: string | null;
  descripcion: string;
  tipo?: string | null;
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

export async function listarDiagnosticos(): Promise<{ diagnosticos: DiagnosticoItem[] }> {
  return fetchJson('/api/diagnosticos');
}

export async function obtenerDiagnosticoPorId(idDiagnostico: number): Promise<{ diagnostico: DiagnosticoItem }> {
  return fetchJson(`/api/diagnosticos/${idDiagnostico}`);
}

export async function registrarDiagnostico(
  datos: DiagnosticoPayload,
): Promise<{ mensaje: string; diagnostico: DiagnosticoItem }> {
  return fetchJson('/api/diagnosticos', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}
