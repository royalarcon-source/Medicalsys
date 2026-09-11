export type EstadoCampana = "BORRADOR" | "PROGRAMADA" | "ACTIVA" | "FINALIZADA" | "CANCELADA";

export interface CrearCampanaDTO {
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
}

export interface CambiarEstadoCampanaDTO {
  estado: EstadoCampana;
}

export interface FiltroCampanasDTO {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
