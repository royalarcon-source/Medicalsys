import { AppDataSource } from "../config/database";
import { Consentimiento } from "../entities/Consentimiento";
import { Paciente } from "../entities/Paciente";

export class ConsentimientoService {
  private consentimientoRepo = AppDataSource.getRepository(Consentimiento);
  private pacienteRepo = AppDataSource.getRepository(Paciente);

  async emitirConsentimiento(datos: {
    idPaciente: number;
    idConsulta?: number;
    tipo: string;
    version: string;
  }) {
    const paciente = await this.pacienteRepo.findOne({
      where: { idPaciente: datos.idPaciente },
    });

    if (!paciente) {
      const error: any = new Error("El paciente indicado no existe.");
      error.status = 404;
      throw error;
    }

    const nuevo = this.consentimientoRepo.create({
      idPaciente: datos.idPaciente,
      idConsulta: datos.idConsulta || null,
      tipo: datos.tipo,
      version: datos.version,
      estado: "PENDIENTE",
      fechaEmision: new Date(),
    });

    return await this.consentimientoRepo.save(nuevo);
  }

  async firmarConsentimiento(idConsentimiento: number, firmadoPor: string) {
    const consentimiento = await this.consentimientoRepo.findOne({
      where: { idConsentimiento },
    });

    if (!consentimiento) {
      const error: any = new Error("Consentimiento no encontrado.");
      error.status = 404;
      throw error;
    }

    if (consentimiento.estado === "FIRMADO") {
      const error: any = new Error("El consentimiento ya se encuentra firmado.");
      error.status = 400;
      throw error;
    }

    consentimiento.estado = "FIRMADO";
    consentimiento.firmadoPor = firmadoPor;
    consentimiento.fechaFirma = new Date();

    return await this.consentimientoRepo.save(consentimiento);
  }

  async obtenerPorPaciente(idPaciente: number) {
    return await this.consentimientoRepo.find({
      where: { idPaciente },
      order: { fechaEmision: "DESC" },
    });
  }
}
