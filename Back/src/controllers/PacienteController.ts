import { Request, Response, NextFunction } from "express";
import { RegistrarPacienteDTO } from "../dtos/paciente/RegistrarPacienteDTO";
import { PacienteService } from "../services/PacienteService";
import { AppError } from "../utils/AppError";

export const PacienteController = {
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
        throw new AppError(
          "documentoIdentidad y fechaNacimiento son obligatorios",
          400
        );
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