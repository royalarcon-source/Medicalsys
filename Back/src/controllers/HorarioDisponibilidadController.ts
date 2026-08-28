// src/controllers/HorarioDisponibilidadController.ts
import { Request, Response, NextFunction } from "express";
import { HorarioDisponibilidadService } from "../services/HorarioDisponibilidadService";
import {
  ActualizarDisponibilidadDTO,
  RegistrarDisponibilidadDTO,
} from "../dtos/disponibilidad/DisponibilidadDTO";
import { AppError } from "../utils/AppError";

function requireAuthUser(req: Request) {
  if (!req.authUser) {
    throw new AppError("Debe iniciar sesión para acceder a esta información", 401);
  }
  return req.authUser;
}

export const HorarioDisponibilidadController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = requireAuthUser(req);

      const datos: RegistrarDisponibilidadDTO = {
        idMedico: req.body.idMedico !== undefined ? Number(req.body.idMedico) : undefined,
        diaSemana: Number(req.body.diaSemana),
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin,
      };

      if (!datos.diaSemana || !datos.horaInicio || !datos.horaFin) {
        return res.status(400).json({
          error: "diaSemana, horaInicio y horaFin son obligatorios",
        });
      }

      const horario = await HorarioDisponibilidadService.registrar(datos, usuarioActual);
      return res.status(201).json({
        mensaje: "Disponibilidad registrada correctamente",
        horario: {
          idHorario: horario.idHorario,
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          activo: horario.activo,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async buscar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = requireAuthUser(req);

      const filtros = {
        idMedico: req.query.idMedico !== undefined ? Number(req.query.idMedico) : undefined,
        idEspecialidad:
          req.query.idEspecialidad !== undefined ? Number(req.query.idEspecialidad) : undefined,
        diaSemana: req.query.diaSemana !== undefined ? Number(req.query.diaSemana) : undefined,
      };

      const resultados = await HorarioDisponibilidadService.buscar(filtros, usuarioActual);
      return res.status(200).json({ resultados });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = requireAuthUser(req);
      const idHorario = Number(req.params.id);

      const cambios: ActualizarDisponibilidadDTO = {
        diaSemana: req.body.diaSemana !== undefined ? Number(req.body.diaSemana) : undefined,
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin,
        activo: req.body.activo,
      };

      const horario = await HorarioDisponibilidadService.actualizar(idHorario, cambios, usuarioActual);
      return res.status(200).json({
        mensaje: "Disponibilidad actualizada correctamente",
        horario: {
          idHorario: horario.idHorario,
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          activo: horario.activo,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async desactivar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = requireAuthUser(req);
      const idHorario = Number(req.params.id);

      await HorarioDisponibilidadService.desactivar(idHorario, usuarioActual);
      return res.status(200).json({ mensaje: "Disponibilidad desactivada correctamente" });
    } catch (error) {
      next(error);
    }
  },
};
