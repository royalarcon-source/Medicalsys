import { Request, Response, NextFunction } from "express";
import { DiagnosticoService } from "../services/DiagnosticoService";

const diagnosticoService = new DiagnosticoService();

export const DiagnosticoController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const diagnostico = await diagnosticoService.registrar(req.body, usuarioActual);
      return res.status(201).json({
        mensaje: "Diagnóstico registrado exitosamente.",
        diagnostico,
      });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const diagnosticos = await diagnosticoService.listar(usuarioActual);
      return res.status(200).json({ diagnosticos });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const idDiagnostico = Number(req.params.id);
      const diagnostico = await diagnosticoService.obtenerPorId(idDiagnostico, usuarioActual);
      return res.status(200).json({ diagnostico });
    } catch (error) {
      next(error);
    }
  },
};
