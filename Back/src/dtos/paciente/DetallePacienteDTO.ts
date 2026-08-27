// src/dtos/paciente/DetallePacienteDTO.ts
export interface DetallePacienteDTO {
  idPaciente: number;
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date;
  sexo: string | null;
  telefono: string | null;
  email: string;
  direccion: string | null;
  contactoEmergencia: string | null;
  telefonoEmergencia: string | null;
  fechaRegistro: Date;
}
