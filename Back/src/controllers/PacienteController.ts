// src/controllers/PacienteController.ts
import { Request, Response, NextFunction } from "express";
import { PacienteService } from "../services/PacienteService";
import { BuscarPacienteDTO } from "../dtos/paciente/BuscarPacienteDTO";
import { RegistrarPacienteDTO } from "../dtos/paciente/RegistrarPacienteDTO";
import { AppError } from "../utils/AppError";

export const PacienteController = {
  async buscar(req: Request, res: Response, next: NextFunction) {
    try {
      const criterios: BuscarPacienteDTO = {
        ci: req.query.ci as string | undefined,
        nombre: req.query.nombre as string | undefined,
        apellido: req.query.apellido as string | undefined,
        page: req.query.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query.limit !== undefined ? Number(req.query.limit) : 10,
      };

      const resultado = await PacienteService.buscarPacientes(criterios);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  },

  async obtenerDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const idPaciente = Number(req.params.id);

      if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
        throw new AppError("El identificador del paciente debe ser un número válido", 400);
      }

      const usuarioActual = req.authUser;
      if (!usuarioActual) {
        throw new AppError("Debe iniciar sesión para acceder a esta información", 401);
      }

      const detalle = await PacienteService.consultarPorId(idPaciente, usuarioActual);
      return res.status(200).json({ paciente: detalle });
    } catch (error) {
      return next(error);
    }
  },

  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const datos: RegistrarPacienteDTO = {
        idUsuario: Number(req.body.idUsuario),
        documentoIdentidad: req.body.documentoIdentidad,
        fechaNacimiento: req.body.fechaNacimiento,
        sexo: req.body.sexo,
        direccion: req.body.direccion,
        contactoEmergencia: req.body.contactoEmergencia,
        telefonoEmergencia: req.body.telefonoEmergencia,
      };

      if (!Number.isInteger(datos.idUsuario) || datos.idUsuario <= 0) {
        throw new AppError("idUsuario debe ser un número entero positivo", 400);
      }

      if (!datos.documentoIdentidad || !datos.fechaNacimiento) {
        throw new AppError("documentoIdentidad y fechaNacimiento son obligatorios", 400);
      }

      if (Number.isNaN(Date.parse(datos.fechaNacimiento))) {
        throw new AppError("fechaNacimiento no tiene un formato válido", 400);
      }

      const paciente = await PacienteService.registrar(datos);
      return res.status(201).json({
        mensaje: "Paciente registrado correctamente",
        paciente: {
          idPaciente: paciente.idPaciente,
          idUsuario: datos.idUsuario,
          documentoIdentidad: paciente.documentoIdentidad,
          fechaNacimiento: paciente.fechaNacimiento,
          sexo: paciente.sexo,
          direccion: paciente.direccion,
          contactoEmergencia: paciente.contactoEmergencia,
          telefonoEmergencia: paciente.telefonoEmergencia,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
