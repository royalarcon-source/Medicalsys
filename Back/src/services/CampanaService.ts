import { CampanaRepository } from "../repositories/CampanaRepository";
import { CrearCampanaDTO, CambiarEstadoCampanaDTO, FiltroCampanasDTO, EstadoCampana } from "../dtos/campana.dto";
import { AppError } from "../utils/AppError";
import { Campana } from "../entities/Campana.entity";

const TRANSICIONES_VALIDAS: Record<EstadoCampana, EstadoCampana[]> = {
  BORRADOR: ["PROGRAMADA", "CANCELADA"],
  PROGRAMADA: ["ACTIVA", "CANCELADA"],
  ACTIVA: ["FINALIZADA", "CANCELADA"],
  FINALIZADA: [],
  CANCELADA: [],
};

export class CampanaService {
  static async crear(dto: CrearCampanaDTO): Promise<Campana> {
    if (!dto.nombre || dto.nombre.trim() === "") {
      throw new AppError("El nombre de la campaña es obligatorio.", 400);
    }
    if (dto.nombre.trim().length > 150) {
      throw new AppError("El nombre de la campaña no puede superar los 150 caracteres.", 400);
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

    const nueva = CampanaRepository.create({
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      // Se guarda el string "YYYY-MM-DD" tal cual (no el Date parseado arriba):
      // TypeORM serializa columnas "date" con los componentes locales del objeto
      // Date, y como new Date("YYYY-MM-DD") lo interpreta en UTC, en hosts con
      // offset negativo se guardaba un día antes del solicitado.
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin || null,
      estado: "BORRADOR",
    });

    return CampanaRepository.save(nueva);
  }

  static async cambiarEstado(idCampana: number, dto: CambiarEstadoCampanaDTO): Promise<Campana> {
    const campana = await CampanaRepository.buscarPorId(idCampana);
    if (!campana) {
      throw new AppError("Campaña no encontrada.", 404);
    }

    const estadoActual = campana.estado as EstadoCampana;
    const permitidos = TRANSICIONES_VALIDAS[estadoActual] ?? [];

    if (!permitidos.includes(dto.estado)) {
      throw new AppError(
        `No se puede cambiar la campaña de "${estadoActual}" a "${dto.estado}".`,
        400
      );
    }

    campana.estado = dto.estado;
    return CampanaRepository.save(campana);
  }

  static async listar(filtros?: FiltroCampanasDTO): Promise<Campana[]> {
    return CampanaRepository.listar(filtros);
  }

  static async obtenerPorId(idCampana: number): Promise<Campana> {
    const campana = await CampanaRepository.buscarPorId(idCampana);
    if (!campana) {
      throw new AppError("Campaña no encontrada.", 404);
    }
    return campana;
  }
}
