import { AppDataSource } from "../config/database";
import { Rol, RolNombre } from "../entities/Rol.entity";

export const RolRepository = AppDataSource.getRepository(Rol).extend({
  findByNombre(nombre: RolNombre) {
    return this.findOne({ where: { nombre } });
  },
});
