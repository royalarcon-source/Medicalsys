import { Request, Response, NextFunction } from "express";
import { EspecialidadService } from "../services/EspecialidadService";

export const EspecialidadController = {
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, descripcion } = req.body;
      if (!nombre) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
      }
      const especialidad = await EspecialidadService.crear({ nombre, descripcion });
      return res.status(201).json({ mensaje: "Especialidad creada", especialidad });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const especialidades = await EspecialidadService.listar();
      return res.json({ especialidades });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { nombre, descripcion } = req.body;
      if (!nombre) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
      }
      const especialidad = await EspecialidadService.actualizar(id, { nombre, descripcion });
      return res.json({ mensaje: "Especialidad actualizada", especialidad });
    } catch (error) {
      next(error);
    }
  },

  async asignarAMedico(req: Request, res: Response, next: NextFunction) {
    try {
      const idMedico = Number(req.params.id);
      const { idEspecialidades } = req.body;

      if (!Array.isArray(idEspecialidades)) {
        return res.status(400).json({ error: "idEspecialidades debe ser un arreglo" });
      }

      await EspecialidadService.asignarAMedico(idMedico, { idEspecialidades });
      return res.json({ mensaje: "Especialidades asignadas correctamente" });
    } catch (error) {
      next(error);
    }
  },
};