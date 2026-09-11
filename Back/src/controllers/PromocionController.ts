import { Request, Response, NextFunction } from "express";
import { PromocionService } from "../services/PromocionService";
import { CrearPromocionDTO, CambiarEstadoPromocionDTO } from "../dtos/promocion.dto";
import { AppError } from "../utils/AppError";

export const PromocionController = {
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CrearPromocionDTO = req.body;
      const promocion = await PromocionService.crear(dto);
      return res.status(201).json({ mensaje: "Promoción creada exitosamente", promocion });
    } catch (error) {
      next(error);
    }
  },

  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const idPromocion = Number(req.params.id);
      if (!Number.isInteger(idPromocion) || idPromocion <= 0) {
        throw new AppError("ID de promoción inválido", 400);
      }

      const dto: CambiarEstadoPromocionDTO = req.body;
      const promocion = await PromocionService.cambiarEstado(idPromocion, dto);
      return res.status(200).json({ mensaje: "Estado de promoción actualizado", promocion });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const filtros = {
        idCampana: req.query.idCampana ? Number(req.query.idCampana) : undefined,
        activa: req.query.activa !== undefined ? req.query.activa === "true" : undefined,
        vigente: req.query.vigente === "true",
      };

      const promociones = await PromocionService.listar(filtros);
      return res.status(200).json({ promociones });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const idPromocion = Number(req.params.id);
      if (!Number.isInteger(idPromocion) || idPromocion <= 0) {
        throw new AppError("ID de promoción inválido", 400);
      }

      const promocion = await PromocionService.obtenerPorId(idPromocion);
      return res.status(200).json({ promocion });
    } catch (error) {
      next(error);
    }
  },
};
