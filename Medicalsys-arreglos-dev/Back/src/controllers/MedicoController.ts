import { Request, Response, NextFunction } from "express";
import { MedicoService } from "../services/MedicoService";
import { RegistrarMedicoDTO } from "../dtos/medico/RegistrarMedicoDTO";

export const MedicoController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const datos: RegistrarMedicoDTO = {
        idUsuario: req.body.idUsuario,
        numeroColegiatura: req.body.numeroColegiatura,
      };

      if (!datos.idUsuario || !datos.numeroColegiatura) {
        return res.status(400).json({
          error: "idUsuario y numeroColegiatura son obligatorios",
        });
      }

      const medico = await MedicoService.registrar(datos);
      return res.status(201).json({
        mensaje: "Médico registrado correctamente",
        medico: {
          idMedico: medico.idMedico,
          numeroColegiatura: medico.numeroColegiatura,
          activo: medico.activo,
        },
      });
    } catch (error) {
      next(error); // lo captura el errorHandler global
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const medico = await MedicoService.buscarPorId(id);
      return res.json({ medico });
    } catch (error) {
      next(error);
    }
  },
};