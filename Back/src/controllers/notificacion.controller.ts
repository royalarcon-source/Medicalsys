import { Request, Response } from "express";
import { notificacionService } from "../services/notificacion.service";

export class NotificacionController {
  enviarWhatsApp = async (req: Request, res: Response) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const idNotificacion = parseInt(idParam, 10);
      const resultado = await notificacionService.enviarRecordatorioWhatsApp(idNotificacion);
      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(error.statusCode || error.status || 400).json({ error: error.message });
    }
  };

  obtenerPorCita = async (req: Request, res: Response) => {
    try {
      const idParam = Array.isArray(req.params.idCita) ? req.params.idCita[0] : req.params.idCita;
      const idCita = parseInt(idParam, 10);
      const data = await notificacionService.listarPorCita(idCita);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
}
