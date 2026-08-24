// src/repositories/EspecialidadRepository.ts
import { AppDataSource } from "../config/database";
import { Especialidad } from "../entities/Especialidad.entity";
import { Medico } from "../entities/Medico.entity";

export const EspecialidadRepository = AppDataSource.getRepository(Especialidad).extend({
  async buscarPorNombre(nombre: string): Promise<Especialidad | null> {
    return this.findOne({ where: { nombre } });
  },

  async listarTodas(): Promise<Especialidad[]> {
    return this.find({ order: { nombre: "ASC" } });
  },

  async buscarPorIds(ids: number[]): Promise<Especialidad[]> {
    return this.createQueryBuilder("especialidad")
      .whereInIds(ids)
      .getMany();
  },
});