// src/services/citasService.ts

export interface CitaPaciente {
  idPaciente: number;
  documentoIdentidad: string;
  usuario?: {
    idUsuario: number;
    nombres: string;
    apellidos: string;
    email: string;
  };
}

export interface CitaMedico {
  idMedico: number;
  numeroColegiatura: string;
  usuario?: {
    idUsuario: number;
    nombres: string;
    apellidos: string;
    email: string;
  };
  especialidades?: { idEspecialidad: number; nombre: string }[];
}

export interface CitaConsultorio {
  idConsultorio: number;
  codigo: string;
  ubicacion?: string;
}

export interface CitaItem {
  idCita: number;
  paciente: CitaPaciente;
  medico: CitaMedico;
  consultorio?: CitaConsultorio | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  motivo?: string | null;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA' | 'NO_ASISTIO';
  fechaCreacion: string;
}

export interface ReservarCitaPayload {
  idMedico: number;
  idPaciente?: number;
  idConsultorio?: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  motivo?: string;
}

export interface ReprogramarCitaPayload {
  fechaHoraInicio: string;
  fechaHoraFin: string;
  motivo?: string;
}

export interface CancelarCitaPayload {
  motivoCancelacion?: string;
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

export async function listarCitas(filtros?: {
  idMedico?: number;
  idPaciente?: number;
  estado?: string;
}): Promise<{ citas: CitaItem[] }> {
  const query = new URLSearchParams();
  if (filtros?.idMedico) query.set('idMedico', String(filtros.idMedico));
  if (filtros?.idPaciente) query.set('idPaciente', String(filtros.idPaciente));
  if (filtros?.estado) query.set('estado', filtros.estado);

  const qs = query.toString();
  return fetchJson(qs ? `/api/citas?${qs}` : '/api/citas');
}

export interface SlotDisponibilidad {
  horaInicio: string;
  horaFin: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  disponible: boolean;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'PASADO';
}

export async function obtenerSlotsMedico(
  idMedico: number,
  fecha: string,
): Promise<{ slots: SlotDisponibilidad[] }> {
  return fetchJson(`/api/citas/slots?idMedico=${idMedico}&fecha=${fecha}`);
}

export async function reservarCita(
  datos: ReservarCitaPayload,
): Promise<{ mensaje: string; cita: CitaItem }> {
  return fetchJson('/api/citas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function reprogramarCita(
  idCita: number,
  datos: ReprogramarCitaPayload,
): Promise<{ mensaje: string; cita: CitaItem }> {
  return fetchJson(`/api/citas/${idCita}/reprogramar`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
}

export async function cancelarCita(
  idCita: number,
  datos?: CancelarCitaPayload,
): Promise<{ mensaje: string; cita: CitaItem }> {
  return fetchJson(`/api/citas/${idCita}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify(datos || {}),
  });
}
