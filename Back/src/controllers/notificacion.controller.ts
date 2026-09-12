import { Request, Response } from "express";
import { notificacionService } from "../services/notificacion.service";
import { RegistrarEstadoNotificacionDTO } from "../dtos/notificacion.dto";

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

  // HU-36: registrar (actualizar) el estado de una notificación
  registrarEstado = async (req: Request, res: Response) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const idNotificacion = parseInt(idParam, 10);
      const dto: RegistrarEstadoNotificacionDTO = req.body;
      const notificacion = await notificacionService.registrarEstado(idNotificacion, dto);
      return res.status(200).json({ mensaje: "Estado de notificación actualizado", notificacion });
    } catch (error: any) {
      return res.status(error.statusCode || error.status || 400).json({ error: error.message });
    }
  };

  // HU-36: listado de notificaciones con filtros
  listar = async (req: Request, res: Response) => {
    try {
      const filtros = {
        estado: req.query.estado as string | undefined,
        canal: req.query.canal as string | undefined,
        idCita: req.query.idCita ? Number(req.query.idCita) : undefined,
      };
      const notificaciones = await notificacionService.listar(filtros, req.authUser);
      return res.status(200).json({ notificaciones });
    } catch (error: any) {
      return res.status(error.statusCode || error.status || 500).json({ error: error.message });
    }
  };

  // HU-36: consulta de una notificación por ID
  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const idNotificacion = parseInt(idParam, 10);
      const notificacion = await notificacionService.obtenerPorId(idNotificacion, req.authUser);
      return res.status(200).json({ notificacion });
    } catch (error: any) {
      return res.status(error.statusCode || error.status || 400).json({ error: error.message });
    }
  };
}
