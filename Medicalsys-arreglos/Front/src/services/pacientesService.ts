export type CriterioBusqueda = 'ci' | 'nombre' | 'apellido';

export interface PacienteResumen {
  idPaciente: number;
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: string | null;
}

export interface PacienteDetalle {
  idPaciente: number;
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: string | null;
  telefono: string | null;
  email: string;
  direccion: string | null;
  contactoEmergencia: string | null;
  telefonoEmergencia: string | null;
  fechaRegistro: string;
}

export interface PacientesApiResponse {
  resultados: PacienteResumen[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}

export interface RegistrarPacientePayload {
  idUsuario: number;
  documentoIdentidad: string;
  fechaNacimiento: string;
  sexo?: string;
  direccion?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
}

export interface PacienteRegistrado {
  idPaciente: number;
  idUsuario: number;
  documentoIdentidad: string;
  fechaNacimiento: string;
  sexo: string | null;
  direccion: string | null;
  contactoEmergencia: string | null;
  telefonoEmergencia: string | null;
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

export async function buscarPacientes(params: {
  criterio: CriterioBusqueda;
  valor: string;
  page?: number;
  limit?: number;
}): Promise<PacientesApiResponse> {
  const query = new URLSearchParams();

  if (params.criterio === 'ci') {
    query.set('ci', params.valor.trim());
  }

  if (params.criterio === 'nombre') {
    query.set('nombre', params.valor.trim());
  }

  if (params.criterio === 'apellido') {
    query.set('apellido', params.valor.trim());
  }

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  const url = `/api/pacientes?${query.toString()}`;
  return fetchJson<PacientesApiResponse>(url);
}

export async function obtenerDetallePaciente(idPaciente: number): Promise<{ paciente: PacienteDetalle }> {
  return fetchJson<{ paciente: PacienteDetalle }>(`/api/pacientes/${idPaciente}`);
}

export async function crearPaciente(
  datos: RegistrarPacientePayload,
): Promise<{ mensaje: string; paciente: PacienteRegistrado }> {
  return fetchJson<{ mensaje: string; paciente: PacienteRegistrado }>('/api/pacientes', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}
