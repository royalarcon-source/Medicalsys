import { AppDataSource } from "../config/database";
import { Usuario } from "../entities/Usuario.entity";

export const UsuarioRepository = AppDataSource.getRepository(Usuario).extend({
  findByEmail(email: string) {
    return this.createQueryBuilder("usuario")
      .addSelect("usuario.passwordHash")
      .leftJoinAndSelect("usuario.rol", "rol")
      .where("usuario.email = :email", { email: email.toLowerCase().trim() })
      .getOne();
  },
  findById(idUsuario: number) {
    return this.findOne({
      where: { idUsuario },
      relations: { rol: true },
    });
  },
});
