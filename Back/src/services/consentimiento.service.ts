import { AppDataSource } from "../config/database";
import { Consentimiento } from "../entities/Consentimiento.entity"; // o "../entities/Consentimiento" si no lleva .entity
import { Paciente } from "../entities/Paciente.entity";
import { Consulta } from "../entities/Consulta.entity";

export class ConsentimientoService {
  private consentimientoRepo = AppDataSource.getRepository(Consentimiento);
  private pacienteRepo = AppDataSource.getRepository(Paciente);
  private consultaRepo = AppDataSource.getRepository(Consulta);

  async emitirConsentimiento(datos: {
    idPaciente: number;
    idConsulta?: number;
    tipo: string;
    version: string;
  }) {
    const paciente = await this.pacienteRepo.findOne({
      where: { idPaciente: datos.idPaciente } as any,
    });

    if (!paciente) {
      const error: any = new Error("El paciente indicado no existe.");
      error.status = 404;
      throw error;
    }

    let consulta: Consulta | null = null;
    if (datos.idConsulta) {
      consulta = await this.consultaRepo.findOne({
        where: { idConsulta: datos.idConsulta } as any,
      });
    }

    const nuevo = this.consentimientoRepo.create({
      paciente,
      consulta: consulta || null,
      tipo: datos.tipo,
      version: datos.version,
      estado: "PENDIENTE",
      fechaEmision: new Date(),
    });

    return await this.consentimientoRepo.save(nuevo);
  }

  async firmarConsentimiento(idConsentimiento: number, firmadoPor: string) {
    const consentimiento = await this.consentimientoRepo.findOne({
      where: { idConsentimiento } as any,
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
      where: { paciente: { idPaciente } } as any,
      relations: { paciente: true, consulta: true },
      order: { fechaEmision: "DESC" },
    });
  }
}
