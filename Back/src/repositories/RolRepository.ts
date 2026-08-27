import { AppDataSource } from "../config/database";
import { Rol } from "../entities/Rol.entity";

export const RolRepository = AppDataSource.getRepository(Rol).extend({
  async buscarPorNombre(nombre: string): Promise<Rol | null> {
    return this.findOne({ where: { nombre } });
  },

  async listarTodos(): Promise<Rol[]> {
    return this.find({ order: { nombre: "ASC" } });
  },
});