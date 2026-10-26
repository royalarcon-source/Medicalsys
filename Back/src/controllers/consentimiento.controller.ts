import { Request, Response } from "express";
import { ConsentimientoService } from "../services/consentimiento.service";

export class ConsentimientoController {
  private service = new ConsentimientoService();

  emitirConsentimiento = async (req: Request, res: Response) => {
    try {
      const { idPaciente, idConsulta, tipo, version } = req.body;
      const consentimiento = await this.service.emitirConsentimiento({
        idPaciente,
        idConsulta,
        tipo,
        version,
      });
      return res.status(201).json({
        mensaje: "Consentimiento informado generado exitosamente.",
        consentimiento,
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ error: error.message });
    }
  };

  firmarConsentimiento = async (req: Request, res: Response) => {
    try {
      const idConsentimiento = Number(req.params.id);
      const { firmadoPor } = req.body;
      const consentimiento = await this.service.firmarConsentimiento(
        idConsentimiento,
        firmadoPor
      );
      return res.status(200).json({
        mensaje: "Consentimiento firmado exitosamente.",
        consentimiento,
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ error: error.message });
    }
  };

  obtenerPorPaciente = async (req: Request, res: Response) => {
    try {
      const idPaciente = Number(req.params.idPaciente);
      const consentimientos = await this.service.obtenerPorPaciente(idPaciente);
      return res.status(200).json(consentimientos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
}
