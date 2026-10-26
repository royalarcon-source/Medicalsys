import { Request, Response, NextFunction } from "express";
import { AtencionServicioService } from "../services/AtencionServicioService";
import {
  RegistrarAtencionServicioDTO,
  ActualizarAtencionServicioDTO,
} from "../dtos/atencionServicio.dto";

export const AtencionServicioController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: RegistrarAtencionServicioDTO = {
        idConsulta: req.body.idConsulta !== undefined ? Number(req.body.idConsulta) : undefined,
        idPaciente: Number(req.body.idPaciente),
        items: req.body.items,
        observacionesGenerales: req.body.observacionesGenerales,
      };

      const resultado = await AtencionServicioService.registrar(dto);
      return res.status(201).json({
        mensaje: "Servicios registrados exitosamente para la atención.",
        servicios: resultado,
      });
    } catch (error) {
      return next(error);
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const idAtencionServicio = Number(req.params.id);
      if (!idAtencionServicio || isNaN(idAtencionServicio)) {
        return res.status(400).json({ error: "ID de servicio de atención inválido." });
      }

      const dto: ActualizarAtencionServicioDTO = {
        cantidad: req.body.cantidad !== undefined ? Number(req.body.cantidad) : undefined,
        precioUnitario: req.body.precioUnitario !== undefined ? Number(req.body.precioUnitario) : undefined,
        observaciones: req.body.observaciones,
      };

      const resultado = await AtencionServicioService.actualizar(idAtencionServicio, dto);
      return res.status(200).json({
        mensaje: "Servicio de la atención actualizado correctamente.",
        servicio: resultado,
      });
    } catch (error) {
      return next(error);
    }
  },

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const idAtencionServicio = Number(req.params.id);
      if (!idAtencionServicio || isNaN(idAtencionServicio)) {
        return res.status(400).json({ error: "ID de servicio de atención inválido." });
      }

      const resultado = await AtencionServicioService.eliminar(idAtencionServicio);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  },

  async listarPorConsulta(req: Request, res: Response, next: NextFunction) {
    try {
      const idConsulta = Number(req.params.idConsulta);
      if (!idConsulta || isNaN(idConsulta)) {
        return res.status(400).json({ error: "ID de consulta médica inválido." });
      }

      const resultado = await AtencionServicioService.listarPorConsulta(idConsulta, req.authUser);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  },

  async listarPorPaciente(req: Request, res: Response, next: NextFunction) {
    try {
      const idPaciente = Number(req.params.idPaciente);
      if (!idPaciente || isNaN(idPaciente)) {
        return res.status(400).json({ error: "ID de paciente inválido." });
      }

      const estado = req.query.estado as string | undefined;
      const resultado = await AtencionServicioService.listarPorPaciente(idPaciente, estado, req.authUser);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  },
};

