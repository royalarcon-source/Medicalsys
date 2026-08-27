// src/repositories/MedicoRepository.ts
import { AppDataSource } from "../config/database";
import { Medico } from "../entities/Medico.entity";
import { Especialidad } from "../entities/Especialidad.entity";
import { AppError } from "../utils/AppError";

export const MedicoRepository = AppDataSource.getRepository(Medico).extend({
  async buscarPorUsuario(idUsuario: number): Promise<Medico | null> {
    return this.findOne({
      where: { usuario: { idUsuario } },
      relations: { usuario: true },
    });
  },

  async buscarPorNumeroColegiatura(numeroColegiatura: string): Promise<Medico | null> {
    return this.findOne({ where: { numeroColegiatura } });
  },

  async buscarPorId(idMedico: number): Promise<Medico | null> {
    return this.findOne({
      where: { idMedico },
      relations: { usuario: true, especialidades: true },
    });
  },

  async crear(datos: { usuarioId: number; numeroColegiatura: string }): Promise<Medico> {
    const medico = this.create({
      usuario: { idUsuario: datos.usuarioId },
      numeroColegiatura: datos.numeroColegiatura,
    });
    return this.save(medico);
  },

  async asignarEspecialidades(idMedico: number, especialidades: Especialidad[]): Promise<Medico> {
  const medico = await this.buscarPorId(idMedico);
  if (!medico) throw new AppError("Médico no encontrado", 404);
  medico.especialidades = especialidades;
  return this.save(medico);
},
});