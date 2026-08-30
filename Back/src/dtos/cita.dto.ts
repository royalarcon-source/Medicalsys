export interface ReservarCitaDTO {
  id_medico: string;
  id_paciente?: string; // Opcional si es Paciente (se toma del token)
  id_consultorio?: string;
  fecha_hora_inicio: string; // ISO string o timestamp
  fecha_hora_fin: string;
  motivo?: string;
  
}

export interface ReprogramarCitaDTO {
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo?: string;
}

export interface CancelarCitaDTO {
  motivo_cancelacion?: string;
}
