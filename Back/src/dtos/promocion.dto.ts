export interface CrearPromocionDTO {
  idCampana: number;
  nombre: string;
  descripcion?: string;
  porcentajeDesc?: number;
  fechaInicio: string;
  fechaFin?: string;
}

export interface CambiarEstadoPromocionDTO {
  activa: boolean;
}

export interface FiltroPromocionesDTO {
  idCampana?: number;
  activa?: boolean;
  vigente?: boolean;
}
