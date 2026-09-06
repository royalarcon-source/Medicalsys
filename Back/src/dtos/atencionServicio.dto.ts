export interface ItemServicioPrestadoDTO {
  idServicio: number;
  cantidad: number;
  precioUnitario?: number;
  observaciones?: string;
}

export interface RegistrarAtencionServicioDTO {
  idConsulta?: number;
  idPaciente: number;
  items: ItemServicioPrestadoDTO[];
  observacionesGenerales?: string;
}

export interface ActualizarAtencionServicioDTO {
  cantidad?: number;
  precioUnitario?: number;
  observaciones?: string;
}

export interface FiltroAtencionServicioDTO {
  idConsulta?: number;
  idPaciente?: number;
  estado?: 'PENDIENTE' | 'FACTURADO' | 'CANCELADO';
}

