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
  idConsulta?: number; // Opcional, para marcar consulta como facturada o vincular
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

