// src/dtos/disponibilidad/DisponibilidadDTO.ts
export interface RegistrarDisponibilidadDTO {
  idMedico?: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface ActualizarDisponibilidadDTO {
  diaSemana?: number;
  horaInicio?: string;
  horaFin?: string;
  activo?: boolean;
}

export interface BuscarDisponibilidadDTO {
  idMedico?: number;
  idEspecialidad?: number;
  diaSemana?: number;
}

export interface DisponibilidadResultadoDTO {
  idHorario: number;
  idMedico: number;
  medicoNombre: string;
  numeroColegiatura: string;
  especialidades: string[];
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}
