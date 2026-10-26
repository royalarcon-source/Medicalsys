import { PromocionRepository } from "../repositories/PromocionRepository";
import { CampanaRepository } from "../repositories/CampanaRepository";
import { CrearPromocionDTO, CambiarEstadoPromocionDTO, FiltroPromocionesDTO } from "../dtos/promocion.dto";
import { AppError } from "../utils/AppError";
import { Promocion } from "../entities/Promocion.entity";

export class PromocionService {
  static async crear(dto: CrearPromocionDTO): Promise<Promocion> {
    if (!dto.idCampana) {
      throw new AppError("El identificador de la campaña es obligatorio.", 400);
    }

    const campana = await CampanaRepository.buscarPorId(dto.idCampana);
    if (!campana) {
      throw new AppError("Campaña no encontrada.", 404);
    }

    if (!dto.nombre || dto.nombre.trim() === "") {
      throw new AppError("El nombre de la promoción es obligatorio.", 400);
    }
    if (dto.nombre.trim().length > 150) {
      throw new AppError("El nombre de la promoción no puede superar los 150 caracteres.", 400);
    }
    if (!dto.fechaInicio) {
      throw new AppError("La fecha de inicio es obligatoria.", 400);
    }

    const fechaInicio = new Date(dto.fechaInicio);
    if (isNaN(fechaInicio.getTime())) {
      throw new AppError("La fecha de inicio no es válida.", 400);
    }

    let fechaFin: Date | null = null;
    if (dto.fechaFin) {
      fechaFin = new Date(dto.fechaFin);
      if (isNaN(fechaFin.getTime())) {
        throw new AppError("La fecha de fin no es válida.", 400);
      }
      if (fechaFin < fechaInicio) {
        throw new AppError("La fecha de fin no puede ser anterior a la fecha de inicio.", 400);
      }
    }

    const campanaFechaInicio = new Date(campana.fechaInicio);
    if (fechaInicio < campanaFechaInicio) {
      throw new AppError("La promoción no puede iniciar antes que su campaña.", 400);
    }
    if (campana.fechaFin) {
      const campanaFechaFin = new Date(campana.fechaFin);
      if (fechaInicio > campanaFechaFin || (fechaFin && fechaFin > campanaFechaFin)) {
        throw new AppError("La vigencia de la promoción debe estar dentro del rango de la campaña.", 400);
      }
    }

    let porcentajeDesc: string | null = null;
    if (dto.porcentajeDesc !== undefined && dto.porcentajeDesc !== null) {
      const porcentaje = Number(dto.porcentajeDesc);
      if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        throw new AppError("El porcentaje de descuento debe estar entre 0 y 100.", 400);
      }
      porcentajeDesc = porcentaje.toFixed(2);
    }

    const nueva = PromocionRepository.create({
      campana: { idCampana: campana.idCampana },
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      porcentajeDesc,
      // Se guarda el string "YYYY-MM-DD" tal cual (no el Date parseado arriba,
      // usado solo para las validaciones): ver nota en CampanaService.crear.
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin || null,
      activa: true,
    });

    const guardada = await PromocionRepository.save(nueva);
    return (await PromocionRepository.buscarPorId(guardada.idPromocion))!;
  }

  static async cambiarEstado(idPromocion: number, dto: CambiarEstadoPromocionDTO): Promise<Promocion> {
    const promocion = await PromocionRepository.buscarPorId(idPromocion);
    if (!promocion) {
      throw new AppError("Promoción no encontrada.", 404);
    }

    promocion.activa = dto.activa;
    return PromocionRepository.save(promocion);
  }

  static async listar(filtros?: FiltroPromocionesDTO): Promise<Promocion[]> {
    return PromocionRepository.listar(filtros);
  }

  static async obtenerPorId(idPromocion: number): Promise<Promocion> {
    const promocion = await PromocionRepository.buscarPorId(idPromocion);
    if (!promocion) {
      throw new AppError("Promoción no encontrada.", 404);
    }
    return promocion;
  }
}
