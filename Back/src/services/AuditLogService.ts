import { AppDataSource } from "../config/database";
import { AuditLog } from "../entities/AuditLog.entity";

export interface RegistrarAuditDTO {
  idUsuario?: number | null;
  rol?: string | null;
  accion: string;
  entidad?: string | null;
  idEntidad?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  resultado: "EXITO" | "ERROR" | "ACCESO_DENEGADO";
  detalle?: Record<string, unknown> | string | null;
}

export interface FiltroAuditDTO {
  idUsuario?: number;
  accion?: string;
  resultado?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

const MAX_LIMIT = 200;

function auditRepo() {
  return AppDataSource.getRepository(AuditLog);
}

/**
 * HU-37: Servicio de auditoría del sistema.
 * Permite registrar eventos y consultarlos con filtros y paginación.
 */
export const AuditLogService = {
  /**
   * Registra un evento de auditoría.
   * Fire-and-forget: nunca lanza excepciones al caller para no interrumpir el flujo
   * principal del sistema por un fallo de auditoría.
   */
  async registrar(dto: RegistrarAuditDTO): Promise<void> {
    try {
      const detalleStr =
        dto.detalle == null
          ? null
          : typeof dto.detalle === "string"
          ? dto.detalle
          : JSON.stringify(dto.detalle);

      const log = auditRepo().create({
        idUsuario: dto.idUsuario ?? null,
        rol: dto.rol ?? null,
        accion: dto.accion,
        entidad: dto.entidad ?? null,
        idEntidad: dto.idEntidad ?? null,
        ip: dto.ip ?? null,
        userAgent: dto.userAgent ?? null,
        resultado: dto.resultado,
        detalle: detalleStr,
      });

      await auditRepo().save(log);
    } catch {
      // Silencioso: un fallo de auditoría no debe detener la operación principal.
    }
  },

  /**
   * Lista los registros de auditoría con filtros y paginación.
   * Solo accesible por ADMINISTRADOR (controlado a nivel de ruta/permiso).
   */
  async listar(filtros: FiltroAuditDTO): Promise<{ total: number; registros: AuditLog[] }> {
    const page  = Math.max(1, Number(filtros.page  ?? 1));
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filtros.limit ?? 50)));
    const skip  = (page - 1) * limit;

    const qb = auditRepo()
      .createQueryBuilder("log")
      .orderBy("log.fecha_hora", "DESC")
      .skip(skip)
      .take(limit);

    if (filtros.idUsuario) {
      qb.andWhere("log.id_usuario = :idUsuario", { idUsuario: filtros.idUsuario });
    }
    if (filtros.accion) {
      qb.andWhere("log.accion ILIKE :accion", { accion: `%${filtros.accion}%` });
    }
    if (filtros.resultado) {
      qb.andWhere("log.resultado = :resultado", { resultado: filtros.resultado });
    }
    if (filtros.entidad) {
      qb.andWhere("log.entidad = :entidad", { entidad: filtros.entidad });
    }
    if (filtros.desde) {
      qb.andWhere("log.fecha_hora >= :desde", { desde: filtros.desde });
    }
    if (filtros.hasta) {
      qb.andWhere("log.fecha_hora <= :hasta", { hasta: filtros.hasta });
    }

    const [registros, total] = await qb.getManyAndCount();
    return { total, registros };
  },
};
