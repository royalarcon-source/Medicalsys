import { AppDataSource } from "../config/database";
import { Paciente } from "../entities/Paciente.entity";

export const PacienteRepository = AppDataSource.getRepository(Paciente).extend({
  async buscarPorUsuario(idUsuario: number): Promise<Paciente | null> {
    return this.findOne({
      where: { usuario: { idUsuario } },
      relations: { usuario: true },
    });
  },

  async buscarPorDocumento(documentoIdentidad: string): Promise<Paciente | null> {
    return this.findOne({ where: { documentoIdentidad } });
  },

  async crear(datos: {
    idUsuario: number;
    documentoIdentidad: string;
    fechaNacimiento: string;
    sexo?: string | null;
    direccion?: string | null;
    contactoEmergencia?: string | null;
    telefonoEmergencia?: string | null;
  }): Promise<Paciente> {
    const paciente = this.create({
      usuario: { idUsuario: datos.idUsuario },
      documentoIdentidad: datos.documentoIdentidad,
      fechaNacimiento: datos.fechaNacimiento,
      sexo: datos.sexo ?? null,
      direccion: datos.direccion ?? null,
      contactoEmergencia: datos.contactoEmergencia ?? null,
      telefonoEmergencia: datos.telefonoEmergencia ?? null,
    });
    return this.save(paciente);
  },
});