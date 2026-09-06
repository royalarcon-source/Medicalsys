import { type ConsultaItem } from './consultasService';

export interface HistoriaClinicaItem {
  idHistoria: number;
  fechaApertura: string;
  observaciones: string | null;
  paciente?: {
    idPaciente: number;
    documentoIdentidad: string;
    fechaNacimiento: string;
    sexo?: string | null;
    direccion?: string | null;
    contactoEmergencia?: string | null;
    telefonoEmergencia?: string | null;
    usuario?: {
      idUsuario: number;
      nombres: string;
      apellidos: string;
      email: string;
      telefono?: string | null;
    };
  };
}

export interface HistoriaClinicaDetalleRespuesta {
  historia: HistoriaClinicaItem | null;
  paciente: {
    idPaciente: number;
    documentoIdentidad: string;
    fechaNacimiento: string;
    sexo?: string | null;
    direccion?: string | null;
    contactoEmergencia?: string | null;
    telefonoEmergencia?: string | null;
    usuario?: {
      idUsuario: number;
      nombres: string;
      apellidos: string;
      email: string;
      telefono?: string | null;
    };
  };
  consultas: ConsultaItem[];
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

export async function buscarHistoriaPorCI(ci: string): Promise<HistoriaClinicaDetalleRespuesta> {
  return fetchJson(`/api/historia-clinica?ci=${encodeURIComponent(ci.trim())}`);
}

export async function abrirHistoriaManual(
  idPaciente: number,
  observaciones?: string,
): Promise<{ mensaje: string; historia: HistoriaClinicaItem }> {
  return fetchJson('/api/historia-clinica', {
    method: 'POST',
    body: JSON.stringify({ idPaciente, observaciones }),
  });
}
