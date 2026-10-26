import { Request, Response, NextFunction } from "express";
import { CampanaService } from "../services/CampanaService";
import { CrearCampanaDTO, CambiarEstadoCampanaDTO } from "../dtos/campana.dto";
import { AppError } from "../utils/AppError";

export const CampanaController = {
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CrearCampanaDTO = req.body;
      const campana = await CampanaService.crear(dto);
      return res.status(201).json({ mensaje: "Campaña creada exitosamente", campana });
    } catch (error) {
      next(error);
    }
  },

  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const idCampana = Number(req.params.id);
      if (!Number.isInteger(idCampana) || idCampana <= 0) {
        throw new AppError("ID de campaña inválido", 400);
      }

      const dto: CambiarEstadoCampanaDTO = req.body;
      const campana = await CampanaService.cambiarEstado(idCampana, dto);
      return res.status(200).json({ mensaje: "Estado de campaña actualizado", campana });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const filtros = {
        estado: req.query.estado as string | undefined,
        fechaInicio: req.query.fechaInicio as string | undefined,
        fechaFin: req.query.fechaFin as string | undefined,
      };

      const campanas = await CampanaService.listar(filtros);
      return res.status(200).json({ campanas });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const idCampana = Number(req.params.id);
      if (!Number.isInteger(idCampana) || idCampana <= 0) {
        throw new AppError("ID de campaña inválido", 400);
      }

      const campana = await CampanaService.obtenerPorId(idCampana);
      return res.status(200).json({ campana });
    } catch (error) {
      next(error);
    }
  },
};
