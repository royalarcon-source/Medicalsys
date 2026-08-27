// src/controllers/PacienteController.ts
import { Request, Response, NextFunction } from "express";
import { PacienteService } from "../services/PacienteService";
import { BuscarPacienteDTO } from "../dtos/paciente/BuscarPacienteDTO";
import { AppError } from "../utils/AppError";

export const PacienteController = {
  async buscar(req: Request, res: Response, next: NextFunction) {
    try {
      const criterios: BuscarPacienteDTO = {
        ci: req.query.ci as string | undefined,
        nombre: req.query.nombre as string | undefined,
        apellido: req.query.apellido as string | undefined,
        page: req.query.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query.limit !== undefined ? Number(req.query.limit) : 10,
      };

      const resultado = await PacienteService.buscarPacientes(criterios);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  },

  async obtenerDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const idPaciente = Number(req.params.id);

      if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
        throw new AppError("El identificador del paciente debe ser un número válido", 400);
      }

      const usuarioActual = (req as any).user;
      if (!usuarioActual) {
        throw new AppError("Debe iniciar sesión para acceder a esta información", 401);
      }

      const detalle = await PacienteService.consultarPorId(idPaciente, usuarioActual);
      return res.status(200).json({ paciente: detalle });
    } catch (error) {
      return next(error);
    }
  },
};
