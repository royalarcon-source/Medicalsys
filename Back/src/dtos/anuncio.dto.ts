export type EstadoAnuncio = "BORRADOR" | "PUBLICADO" | "ARCHIVADO";

export interface CrearAnuncioDTO {
  titulo: string;
  contenido: string;
  fechaExpiracion?: string;
}

export interface CambiarEstadoAnuncioDTO {
  estado: EstadoAnuncio;
}

export interface FiltroAnunciosDTO {
  estado?: string;
  todos?: boolean;
}
