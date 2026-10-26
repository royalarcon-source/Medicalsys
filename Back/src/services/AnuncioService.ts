import { AnuncioRepository } from "../repositories/AnuncioRepository";
import { CrearAnuncioDTO, CambiarEstadoAnuncioDTO, FiltroAnunciosDTO, EstadoAnuncio } from "../dtos/anuncio.dto";
import { AppError } from "../utils/AppError";
import { Anuncio } from "../entities/Anuncio.entity";

const TRANSICIONES_VALIDAS: Record<EstadoAnuncio, EstadoAnuncio[]> = {
  BORRADOR: ["PUBLICADO", "ARCHIVADO"],
  PUBLICADO: ["ARCHIVADO"],
  ARCHIVADO: [],
};

function hoyComoFechaSQL(): string {
  return new Date().toISOString().slice(0, 10);
}

export class AnuncioService {
  static async crear(dto: CrearAnuncioDTO): Promise<Anuncio> {
    if (!dto.titulo || dto.titulo.trim() === "") {
      throw new AppError("El título del anuncio es obligatorio.", 400);
    }
    if (dto.titulo.trim().length > 150) {
      throw new AppError("El título del anuncio no puede superar los 150 caracteres.", 400);
    }
    if (!dto.contenido || dto.contenido.trim() === "") {
      throw new AppError("El contenido del anuncio es obligatorio.", 400);
    }

    let fechaExpiracion: string | null = null;
    if (dto.fechaExpiracion) {
      const fecha = new Date(dto.fechaExpiracion);
      if (isNaN(fecha.getTime())) {
        throw new AppError("La fecha de expiración no es válida.", 400);
      }
      fechaExpiracion = dto.fechaExpiracion;
    }

    const nuevo = AnuncioRepository.create({
      titulo: dto.titulo.trim(),
      contenido: dto.contenido.trim(),
      fechaPublicacion: null,
      // Se guarda el string "YYYY-MM-DD" tal cual, no un Date parseado (mismo criterio
      // que Campana/Promocion para evitar el desfase de huso horario en columnas "date").
      fechaExpiracion: fechaExpiracion as any,
      estado: "BORRADOR",
    });

    return AnuncioRepository.save(nuevo);
  }

  static async cambiarEstado(idAnuncio: number, dto: CambiarEstadoAnuncioDTO): Promise<Anuncio> {
    const anuncio = await AnuncioRepository.buscarPorId(idAnuncio);
    if (!anuncio) {
      throw new AppError("Anuncio no encontrado.", 404);
    }

    const estadoActual = anuncio.estado as EstadoAnuncio;
    const permitidos = TRANSICIONES_VALIDAS[estadoActual] ?? [];

    if (!permitidos.includes(dto.estado)) {
      throw new AppError(
        `No se puede cambiar el anuncio de "${estadoActual}" a "${dto.estado}".`,
        400
      );
    }

    if (dto.estado === "PUBLICADO") {
      if (anuncio.fechaExpiracion && String(anuncio.fechaExpiracion) < hoyComoFechaSQL()) {
        throw new AppError("No se puede publicar un anuncio cuya fecha de expiración ya pasó.", 400);
      }
      if (!anuncio.fechaPublicacion) {
        anuncio.fechaPublicacion = hoyComoFechaSQL() as any;
      }
    }

    anuncio.estado = dto.estado;
    return AnuncioRepository.save(anuncio);
  }

  static async listar(filtros?: FiltroAnunciosDTO): Promise<Anuncio[]> {
    return AnuncioRepository.listar(filtros);
  }

  static async obtenerPorId(idAnuncio: number, todos = false): Promise<Anuncio> {
    const anuncio = await AnuncioRepository.buscarPorId(idAnuncio);
    if (!anuncio) {
      throw new AppError("Anuncio no encontrado.", 404);
    }

    if (!todos) {
      const vigente =
        anuncio.estado === "PUBLICADO" &&
        (!anuncio.fechaExpiracion || String(anuncio.fechaExpiracion) >= hoyComoFechaSQL());
      if (!vigente) {
        throw new AppError("Anuncio no encontrado.", 404);
      }
    }

    return anuncio;
  }
}
