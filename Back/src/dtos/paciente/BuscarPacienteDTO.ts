// src/dtos/paciente/BuscarPacienteDTO.ts
export interface BuscarPacienteDTO {
  ci?: string;
  nombre?: string;
  apellido?: string;
  page?: number;
  limit?: number;
}

export interface PacienteResultadoDTO {
  idPaciente: number;
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date;
  sexo: string | null;
}

export interface BuscarPacientesResponseDTO {
  resultados: PacienteResultadoDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}
