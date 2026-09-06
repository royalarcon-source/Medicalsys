export interface RegistrarPacienteDTO {
  idUsuario: number;
  documentoIdentidad: string;
  fechaNacimiento: string;
  sexo?: string | null;
  direccion?: string | null;
  contactoEmergencia?: string | null;
  telefonoEmergencia?: string | null;
}