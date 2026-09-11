import { Request, Response, NextFunction } from "express";
import { ConsultaService } from "../services/ConsultaService";
import { EstadoConsulta, TipoIngreso } from "../entities/Consulta.entity";

const consultaService = new ConsultaService();

export const ConsultaController = {
  async registrarSinCita(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const {
        idPaciente,
        idMedico,
        idConsultorio,
        motivo,
        tipoIngreso,
        confirmarSobrecupo,
      } = req.body;

      const resultado = await consultaService.registrarSinCita(
        {
          idPaciente: Number(idPaciente),
          idMedico: Number(idMedico),
          idConsultorio: idConsultorio ? Number(idConsultorio) : undefined,
          motivo,
          tipoIngreso: tipoIngreso as TipoIngreso,
          confirmarSobrecupo: Boolean(confirmarSobrecupo),
        },
        usuarioActual
      );

      return res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const idMedico = req.query.idMedico ? Number(req.query.idMedico) : undefined;
      const idPaciente = req.query.idPaciente ? Number(req.query.idPaciente) : undefined;
      const fecha = req.query.fecha ? String(req.query.fecha) : undefined;
      const estadoConsulta = req.query.estadoConsulta as EstadoConsulta | undefined;
      const tipoIngreso = req.query.tipoIngreso as TipoIngreso | undefined;

      const consultas = await consultaService.listar(
        {
          idMedico,
          idPaciente,
          fecha,
          estadoConsulta,
          tipoIngreso,
        },
        usuarioActual
      );

      return res.status(200).json({ consultas });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const idConsulta = Number(req.params.id);
      const consulta = await consultaService.obtenerPorId(idConsulta, usuarioActual);
      return res.status(200).json({ consulta });
    } catch (error) {
      next(error);
    }
  },

  async completar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const idConsulta = Number(req.params.id);
      const { motivo, anamnesis, examenFisico, observaciones, diagnosticos, tratamientos } = req.body;

      const consulta = await consultaService.completar(
        idConsulta,
        {
          motivo,
          anamnesis,
          examenFisico,
          observaciones,
          diagnosticos,
          tratamientos,
        },
        usuarioActual
      );

      return res.status(200).json({
        mensaje: "Consulta clínica completada y registrada exitosamente.",
        consulta,
      });
    } catch (error) {
      next(error);
    }
  },

  async actualizarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioActual = (req as any).authUser;
      const idConsulta = Number(req.params.id);
      const { estadoConsulta } = req.body;

      const consulta = await consultaService.actualizarEstado(
        idConsulta,
        estadoConsulta as EstadoConsulta,
        usuarioActual
      );

      return res.status(200).json({
        mensaje: `Estado de la consulta actualizado a ${estadoConsulta}.`,
        consulta,
      });
    } catch (error) {
      next(error);
    }
  },
};
