// src/dtos/consultorio/CrearConsultorioDTO.ts
export interface CrearConsultorioDTO {
  nombre: string;
  tipo: string;
  piso?: string | null;
  capacidad?: number;
}
