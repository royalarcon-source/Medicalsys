import { Request, Response, NextFunction } from "express";
import { ServicioService } from "../services/ServicioService";

export const ServicioController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const servicios = await ServicioService.listar();
      return res.status(200).json(servicios);
    } catch (error) {
      return next(error);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, descripcion, precio } = req.body;
      const nuevo = await ServicioService.crear({ nombre, descripcion, precio });
      return res.status(201).json(nuevo);
    } catch (error) {
      return next(error);
    }
  },
};

