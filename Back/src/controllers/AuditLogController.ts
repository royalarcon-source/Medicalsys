import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "../services/AuditLogService";
import { AppError } from "../utils/AppError";

/**
 * HU-39: Controller del registro de auditoría.
 * Accesible únicamente por ADMINISTRADOR (enforced en la ruta).
 */
export const AuditLogController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        idUsuario,
        accion,
        resultado,
        entidad,
        desde,
        hasta,
        page,
        limit,
      } = req.query;

      if (idUsuario !== undefined) {
        const id = Number(idUsuario);
        if (!Number.isInteger(id) || id <= 0) {
          throw new AppError("idUsuario debe ser un entero positivo.", 400);
        }
      }

      const resultado_valor = resultado as string | undefined;
      const RESULTADOS_VALIDOS = ["EXITO", "ERROR", "ACCESO_DENEGADO"];
      if (resultado_valor && !RESULTADOS_VALIDOS.includes(resultado_valor)) {
        throw new AppError(
          `resultado inválido. Valores permitidos: ${RESULTADOS_VALIDOS.join(", ")}`,
          400,
        );
      }

      const { total, registros } = await AuditLogService.listar({
        idUsuario: idUsuario ? Number(idUsuario) : undefined,
        accion: accion ? String(accion) : undefined,
        resultado: resultado_valor,
        entidad: entidad ? String(entidad) : undefined,
        desde: desde ? String(desde) : undefined,
        hasta: hasta ? String(hasta) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.status(200).json({ total, registros });
    } catch (error) {
      next(error);
    }
  },
};
