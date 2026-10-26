import { Request, Response, NextFunction } from "express";
import { TratamientoService } from "../services/TratamientoService";

const tratamientoService = new TratamientoService();

export const TratamientoController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const tratamiento = await tratamientoService.registrar(req.body, usuarioActual);
      return res.status(201).json({
        mensaje: "Tratamiento registrado exitosamente.",
        tratamiento,
      });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const tratamientos = await tratamientoService.listar(usuarioActual);
      return res.status(200).json({ tratamientos });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const idTratamiento = Number(req.params.id);
      const tratamiento = await tratamientoService.obtenerPorId(idTratamiento, usuarioActual);
      return res.status(200).json({ tratamiento });
    } catch (error) {
      next(error);
    }
  },
};
