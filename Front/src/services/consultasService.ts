export type TipoIngreso = 'CONSULTA_ESPONTANEA' | 'SOBRECUPO' | 'URGENCIA_MENOR' | 'CITA_PROGRAMADA';
export type EstadoConsulta = 'EN_ESPERA' | 'EN_ATENCION' | 'ATENDIDA' | 'CANCELADA';

export interface DiagnosticoItem {
  idDiagnostico?: number;
  codigo?: string | null;
  descripcion: string;
  tipo?: string | null;
}

export interface TratamientoItem {
  idTratamiento?: number;
  descripcion: string;
  indicaciones?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface ConsultaItem {
  idConsulta: number;
  fechaConsulta: string;
  motivo: string | null;
  anamnesis?: string | null;
  examenFisico?: string | null;
  observaciones?: string | null;
  tipoIngreso: TipoIngreso | null;
  numeroTurno: number | null;
  estadoConsulta: EstadoConsulta;
  diagnosticos?: DiagnosticoItem[];
  tratamientos?: TratamientoItem[];
  historia?: {
    idHistoria: number;
    paciente?: {
      idPaciente: number;
      documentoIdentidad: string;
      fechaNacimiento?: string;
      sexo?: string | null;
      usuario?: {
        nombres: string;
        apellidos: string;
        telefono: string | null;
        email?: string;
      };
    };
  };
  medico?: {
    idMedico: number;
    numeroColegiatura: string;
    usuario?: {
      nombres: string;
      apellidos: string;
    };
    especialidades?: Array<{ idEspecialidad: number; nombre: string }>;
  };
  consultorio?: {
    idConsultorio: number;
    nombre: string;
    tipo: string;
  } | null;
  cita?: {
    idCita: number;
  } | null;
}

export interface RegistrarSinCitaPayload {
  idPaciente: number;
  idMedico: number;
  idConsultorio?: number;
  motivo: string;
  tipoIngreso?: TipoIngreso;
  confirmarSobrecupo?: boolean;
}

export interface CompletarConsultaPayload {
  motivo?: string;
  anamnesis?: string;
  examenFisico?: string;
  observaciones?: string;
  diagnosticos?: Array<{
    codigo?: string;
    descripcion: string;
    tipo?: string;
  }>;
  tratamientos?: Array<{
    descripcion: string;
    indicaciones?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }>;
}

export interface TicketTurno {
  numeroTurno: number;
  posCola: number;
  mensaje: string;
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

export async function listarConsultas(filtros?: {
  idMedico?: number;
  idPaciente?: number;
  fecha?: string;
  estadoConsulta?: EstadoConsulta;
  tipoIngreso?: TipoIngreso;
}): Promise<{ consultas: ConsultaItem[] }> {
  const query = new URLSearchParams();
  if (filtros?.idMedico) query.set('idMedico', String(filtros.idMedico));
  if (filtros?.idPaciente) query.set('idPaciente', String(filtros.idPaciente));
  if (filtros?.fecha) query.set('fecha', filtros.fecha);
  if (filtros?.estadoConsulta) query.set('estadoConsulta', filtros.estadoConsulta);
  if (filtros?.tipoIngreso) query.set('tipoIngreso', filtros.tipoIngreso);

  const qs = query.toString();
  return fetchJson(qs ? `/api/consultas?${qs}` : '/api/consultas');
}

export async function obtenerConsultaPorId(
  idConsulta: number,
): Promise<{ consulta: ConsultaItem }> {
  return fetchJson(`/api/consultas/${idConsulta}`);
}

export async function registrarAtencionSinCita(
  datos: RegistrarSinCitaPayload,
): Promise<{ consulta: ConsultaItem; ticket: TicketTurno }> {
  return fetchJson('/api/consultas/sin-cita', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function completarConsulta(
  idConsulta: number,
  datos: CompletarConsultaPayload,
): Promise<{ mensaje: string; consulta: ConsultaItem }> {
  return fetchJson(`/api/consultas/${idConsulta}/completar`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
}

export async function actualizarEstadoConsulta(
  idConsulta: number,
  estadoConsulta: EstadoConsulta,
): Promise<{ mensaje: string; consulta: ConsultaItem }> {
  return fetchJson(`/api/consultas/${idConsulta}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estadoConsulta }),
  });
}
