import { RolNombre } from "../entities/Rol.entity";

export interface RegisterDTO {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  rol: RolNombre;
  telefono?: string;
  // Campos opcionales solo cuando rol === PACIENTE
  documentoIdentidad?: string;
  fechaNacimiento?: string;
  sexo?: string;
  direccion?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}
