import { AppDataSource } from "../config/database";
import { Usuario } from "../entities/Usuario.entity";

export const UsuarioRepository = AppDataSource.getRepository(Usuario).extend({
  findByEmail(email: string) {
    return this.findOne({
      where: { email: email.toLowerCase().trim() },
      relations: {
        roles: true,
      },
    });
  },
  findById(id_usuario: string) {
    return this.findOne({
      where: { id_usuario },
      relations: {
        roles: true,
      },
    });
  },
});
