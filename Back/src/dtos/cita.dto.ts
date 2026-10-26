export interface ReservarCitaDTO {
  idMedico?: number;
  id_medico?: number;
  idPaciente?: number;
  id_paciente?: number;
  idConsultorio?: number;
  id_consultorio?: number;
  fechaHoraInicio?: string;
  fecha_hora_inicio?: string;
  fechaHoraFin?: string;
  fecha_hora_fin?: string;
  motivo?: string;
}

export interface ReprogramarCitaDTO {
  fechaHoraInicio?: string;
  fecha_hora_inicio?: string;
  fechaHoraFin?: string;
  fecha_hora_fin?: string;
  motivo?: string;
}

export interface CancelarCitaDTO {
  motivoCancelacion?: string;
  motivo_cancelacion?: string;
}

export interface CitaFiltrosDTO {
  idMedico?: number;
  idPaciente?: number;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
