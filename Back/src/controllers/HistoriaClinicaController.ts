import { Request, Response } from "express";
import { HistoriaClinicaService } from "../services/HistoriaClinicaService";

const historiaService = new HistoriaClinicaService();

export class HistoriaClinicaController {
  static async buscarPorCI(req: Request, res: Response): Promise<void> {
    try {
      const ci = req.query.ci as string;
      const resultado = await historiaService.buscarPorCI(ci);
      res.json(resultado);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message || "Error interno del servidor" });
    }
  }

  static async abrirManual(req: Request, res: Response): Promise<void> {
    try {
      const { idPaciente, observaciones } = req.body;
      const historia = await historiaService.abrirManual(Number(idPaciente), observaciones);
      res.status(201).json({
        mensaje: "Historia clínica abierta exitosamente.",
        historia,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message || "Error interno del servidor" });
    }
  }
}
