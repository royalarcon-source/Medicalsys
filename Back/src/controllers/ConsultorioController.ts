import { Request, Response, NextFunction } from "express";
import { ConsultorioService } from "../services/ConsultorioService";

const consultorioService = new ConsultorioService();

export const ConsultorioController = {
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, tipo, piso, capacidad } = req.body;

      const consultorio = await consultorioService.crear({
        nombre,
        tipo,
        piso,
        capacidad: capacidad !== undefined ? Number(capacidad) : undefined,
      });

      return res.status(201).json({
        mensaje: "Consultorio registrado exitosamente.",
        consultorio,
      });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const fecha = String(req.query.fecha || "");
      const horaInicio = String(req.query.horaInicio || "");
      const horaFin = String(req.query.horaFin || "");
      const excludeCitaId = req.query.excludeCitaId ? Number(req.query.excludeCitaId) : undefined;

      if (fecha && horaInicio && horaFin) {
        const consultorios = await consultorioService.listarDisponibles(
          fecha,
          horaInicio,
          horaFin,
          excludeCitaId
        );
        return res.status(200).json({ consultorios });
      }

      const consultorios = await consultorioService.listarTodos();
      return res.status(200).json({ consultorios });
    } catch (error) {
      next(error);
    }
  },

  async asignarACita(req: Request, res: Response, next: NextFunction) {
    try {
      const idCita = Number(req.params.id || req.body.idCita);
      const idConsultorio = Number(req.body.idConsultorio);

      const cita = await consultorioService.asignarACita(
        idCita,
        idConsultorio,
        (req as any).authUser
      );

      return res.status(200).json({
        mensaje: "Consultorio asignado exitosamente a la cita.",
        cita,
      });
    } catch (error) {
      next(error);
    }
  },

  async liberarDeCita(req: Request, res: Response, next: NextFunction) {
    try {
      const idCita = Number(req.params.id);

      const cita = await consultorioService.liberarDeCita(
        idCita,
        (req as any).authUser
      );

      return res.status(200).json({
        mensaje: "Consultorio liberado exitosamente de la cita.",
        cita,
      });
    } catch (error) {
      next(error);
    }
  },
};
