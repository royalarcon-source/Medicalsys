import { AppDataSource } from "../config/database";
import { Servicio } from "../entities/Servicio.entity";

export const ServicioRepository = AppDataSource.getRepository(Servicio).extend({
  async listarActivos(): Promise<Servicio[]> {
    return this.find({
      where: { activo: true },
      order: { nombre: "ASC" },
    });
  },

  async buscarPorId(idServicio: number): Promise<Servicio | null> {
    return this.findOne({ where: { idServicio } });
  },

  async buscarPorNombre(nombre: string): Promise<Servicio | null> {
    return this.findOne({ where: { nombre } });
  },
});

