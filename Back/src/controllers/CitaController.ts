// src/controllers/CitaController.ts
import { Request, Response, NextFunction } from "express";
import { citaService } from "../services/CitaService";
import { ConsultorioService } from "../services/ConsultorioService";
import { ReservarCitaDTO, ReprogramarCitaDTO, CancelarCitaDTO } from "../dtos/cita.dto";
import { AppError } from "../utils/AppError";

function getUsuarioActual(req: Request) {
  if (req.authUser) {
    return req.authUser;
  }
  const user = (req as any).user;
  if (user) {
    return {
      idUsuario: Number(user.id_usuario),
      rol: user.rol,
    };
  }
  throw new AppError("Debe iniciar sesión para realizar esta operación", 401);
}

export const CitaController = {
  async reservar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = getUsuarioActual(req);
      const dto: ReservarCitaDTO = req.body;
      const cita = await citaService.reservar(dto, usuarioActual);

      return res.status(201).json({
        mensaje: "Cita reservada exitosamente",
        cita,
      });
    } catch (error) {
      next(error);
    }
  },

  async reprogramar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = getUsuarioActual(req);
      const idCita = Number(req.params.id);
      if (!Number.isInteger(idCita) || idCita <= 0) {
        throw new AppError("ID de cita inválido", 400);
      }

      const dto: ReprogramarCitaDTO = req.body;
      const cita = await citaService.reprogramar(idCita, dto, usuarioActual);

      return res.status(200).json({
        mensaje: "Cita reprogramada exitosamente",
        cita,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = getUsuarioActual(req);
      const idCita = Number(req.params.id);
      if (!Number.isInteger(idCita) || idCita <= 0) {
        throw new AppError("ID de cita inválido", 400);
      }

      const dto: CancelarCitaDTO = req.body;
      const cita = await citaService.cancelar(idCita, dto, usuarioActual);

      return res.status(200).json({
        mensaje: "Cita cancelada correctamente",
        cita,
      });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = getUsuarioActual(req);
      const filtros = {
        idMedico: req.query.idMedico ? Number(req.query.idMedico) : undefined,
        idPaciente: req.query.idPaciente ? Number(req.query.idPaciente) : undefined,
        estado: req.query.estado as string | undefined,
      };

      const citas = await citaService.listar(usuarioActual, filtros);
      return res.status(200).json({ citas });
    } catch (error) {
      next(error);
    }
  },

  async obtenerSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const idMedico = Number(req.query.idMedico || req.params.idMedico);
      const fecha = String(req.query.fecha || "");

      const slots = await citaService.obtenerSlotsDisponibles(idMedico, fecha);
      return res.status(200).json({ slots });
    } catch (error) {
      next(error);
    }
  },

  async asignarConsultorio(req: Request, res: Response, next: NextFunction) {
    try {
      const idCita = Number(req.params.id);
      const idConsultorio = Number(req.body.idConsultorio);
      const usuarioActual = (req as any).authUser;

      const consultorioService = new ConsultorioService();
      const cita = await consultorioService.asignarACita(idCita, idConsultorio, usuarioActual);

      return res.status(200).json({
        mensaje: "Consultorio asignado exitosamente.",
        cita,
      });
    } catch (error) {
      next(error);
    }
  },

  async liberarConsultorio(req: Request, res: Response, next: NextFunction) {
    try {
      const idCita = Number(req.params.id);
      const usuarioActual = (req as any).authUser;

      const consultorioService = new ConsultorioService();
      const cita = await consultorioService.liberarDeCita(idCita, usuarioActual);

      return res.status(200).json({
        mensaje: "Consultorio liberado exitosamente.",
        cita,
      });
    } catch (error) {
      next(error);
    }
  },
};
