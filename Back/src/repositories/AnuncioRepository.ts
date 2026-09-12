import { AppDataSource } from "../config/database";
import { Anuncio } from "../entities/Anuncio.entity";
import { FiltroAnunciosDTO } from "../dtos/anuncio.dto";

export const AnuncioRepository = AppDataSource.getRepository(Anuncio).extend({
  async buscarPorId(idAnuncio: number): Promise<Anuncio | null> {
    return this.findOne({ where: { idAnuncio } });
  },

  async listar(filtros?: FiltroAnunciosDTO): Promise<Anuncio[]> {
    const qb = this.createQueryBuilder("anuncio");

    if (filtros?.todos) {
      // Listado completo (reservado a ANUNCIO_GESTIONAR): admite filtro libre por estado.
      if (filtros.estado) {
        qb.andWhere("anuncio.estado = :estado", { estado: filtros.estado });
      }
    } else {
      // Zona de anuncios pública (CA-06): solo publicados y vigentes.
      qb.andWhere("anuncio.estado = :publicado", { publicado: "PUBLICADO" });
      qb.andWhere("(anuncio.fecha_expiracion IS NULL OR anuncio.fecha_expiracion >= CURRENT_DATE)");
    }

    return qb.orderBy("anuncio.fecha_publicacion", "DESC").addOrderBy("anuncio.id_anuncio", "DESC").getMany();
  },
});
