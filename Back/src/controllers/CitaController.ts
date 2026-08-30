import { Request, Response } from "express";
import { CitaService } from "../services/CitaService";

const citaService = new CitaService();

export class CitaController {
  async reservar(req: Request, res: Response): Promise<void> {
    try {
      const cita = await citaService.reservar(req.body, req.user as any);
      res.status(201).json({ message: "Cita reservada exitosamente.", cita });
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || "Error al reservar la cita." });
    }
  }

  async reprogramar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cita = await citaService.reprogramar(id, req.body, req.user as any);
      res.status(200).json({ message: "Cita reprogramada correctamente.", cita });
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || "Error al reprogramar la cita." });
    }
  }

  async cancelar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cita = await citaService.cancelar(id, req.body, req.user as any);
      res.status(200).json({ message: "Cita cancelada con éxito.", cita });
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || "Error al cancelar la cita." });
    }
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const citas = await citaService.listar(req.user as any);
      res.status(200).json({ citas });
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || "Error al listar las citas." });
    }
  }
}
