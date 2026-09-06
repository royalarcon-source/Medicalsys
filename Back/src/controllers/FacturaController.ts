import { Request, Response, NextFunction } from "express";
import { FacturaService } from "../services/FacturaService";
import { EmitirFacturaDTO, FiltroFacturasDTO } from "../dtos/factura.dto";

export const FacturaController = {
  async emitir(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: EmitirFacturaDTO = {
        idPaciente: Number(req.body.idPaciente),
        nitCliente: req.body.nitCliente,
        razonSocial: req.body.razonSocial,
        items: req.body.items,
        descuento: req.body.descuento !== undefined ? Number(req.body.descuento) : undefined,
        porcentajeDescuento: req.body.porcentajeDescuento !== undefined ? Number(req.body.porcentajeDescuento) : undefined,
        estado: req.body.estado,
        idsAtencionServicio: Array.isArray(req.body.idsAtencionServicio)
          ? req.body.idsAtencionServicio.map(Number)
          : undefined,
      };

      const factura = await FacturaService.emitir(dto, req.authUser);
      return res.status(201).json({
        mensaje: "Factura emitida exitosamente",
        factura,
      });
    } catch (error) {
      return next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const filtros: FiltroFacturasDTO = {
        idPaciente: req.query.idPaciente ? Number(req.query.idPaciente) : undefined,
        nitCliente: req.query.nitCliente as string | undefined,
        estado: req.query.estado as string | undefined,
        fechaInicio: req.query.fechaInicio as string | undefined,
        fechaFin: req.query.fechaFin as string | undefined,
        busqueda: (req.query.busqueda || req.query.q) as string | undefined,
      };

      const facturas = await FacturaService.listar(filtros, req.authUser);
      return res.status(200).json(facturas);
    } catch (error) {
      return next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const idFactura = Number(req.params.id);
      if (!idFactura || isNaN(idFactura)) {
        return res.status(400).json({ error: "ID de factura inválido" });
      }

      const factura = await FacturaService.obtenerPorId(idFactura, req.authUser);
      return res.status(200).json(factura);
    } catch (error) {
      return next(error);
    }
  },

  async obtenerPendientesPorPaciente(req: Request, res: Response, next: NextFunction) {
    try {
      const idPaciente = Number(req.params.idPaciente);
      if (!idPaciente || isNaN(idPaciente)) {
        return res.status(400).json({ error: "ID de paciente inválido" });
      }

      const pendientes = await FacturaService.obtenerPendientesDeFacturacion(idPaciente);
      return res.status(200).json(pendientes);
    } catch (error) {
      return next(error);
    }
  },
};

