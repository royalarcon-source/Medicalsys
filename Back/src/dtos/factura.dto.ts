export interface ItemFacturaDTO {
  idServicio: number;
  cantidad: number;
  precioUnitario?: number;
}

export interface EmitirFacturaDTO {
  idPaciente: number;
  nitCliente?: string;
  razonSocial?: string;
  items: ItemFacturaDTO[];
  descuento?: number; // Monto de descuento directo (Bs)
  porcentajeDescuento?: number; // Descuento porcentual (%)
  estado?: "EMITIDA" | "PAGADA";
  idsAtencionServicio?: number[]; // AtencionServicio pendientes que esta factura cierra (se marcan FACTURADO)
}

export interface FiltroFacturasDTO {
  idPaciente?: number;
  nitCliente?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
}

export interface CrearServicioDTO {
  nombre: string;
  descripcion?: string;
  precio: number;
}

export interface AnularFacturaDTO {
  motivo: string;
}

