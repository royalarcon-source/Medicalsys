import { Request, Response, NextFunction } from "express";
import { CrearRolDTO } from "../dtos/rol/CrearRolDTO";
import { RolService } from "../services/RolService";
import { AppError } from "../utils/AppError";

export const RolController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await RolService.listar();
      return res.json({ roles });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const idRol = Number(req.params.id);
      if (!Number.isInteger(idRol) || idRol <= 0) {
        throw new AppError("El id del rol debe ser un número entero positivo", 400);
      }

      const rol = await RolService.buscarPorId(idRol);
      return res.json({ rol });
    } catch (error) {
      next(error);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const datos: CrearRolDTO = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
      };

      if (typeof datos.nombre !== "string" || !datos.nombre.trim()) {
        throw new AppError("El nombre del rol es obligatorio", 400);
      }

      const rol = await RolService.crear(datos);
      return res.status(201).json({
        mensaje: "Rol creado correctamente",
        rol,
      });
    } catch (error) {
      next(error);
    }
  },
};