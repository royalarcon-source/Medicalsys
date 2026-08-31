import { AppDataSource } from "../config/database";
import { HistoriaClinica } from "../entities/HistoriaClinica.entity";

export const HistoriaClinicaRepository = AppDataSource.getRepository(HistoriaClinica).extend({
  async buscarPorPaciente(idPaciente: number): Promise<HistoriaClinica | null> {
    return this.findOne({
      where: { paciente: { idPaciente } },
      relations: { paciente: { usuario: true } },
    });
  },

  async crearParaPaciente(idPaciente: number, observaciones?: string): Promise<HistoriaClinica> {
    const historia = this.create({
      paciente: { idPaciente },
      observaciones: observaciones || "Apertura de historia clínica",
    });
    return this.save(historia);
  },
});
