import { AppDataSource } from "../config/database";
import { Campana } from "../entities/Campana.entity";
import { FiltroCampanasDTO } from "../dtos/campana.dto";

export const CampanaRepository = AppDataSource.getRepository(Campana).extend({
  async buscarPorId(idCampana: number): Promise<Campana | null> {
    return this.findOne({ where: { idCampana } });
  },

  async listar(filtros?: FiltroCampanasDTO): Promise<Campana[]> {
    const qb = this.createQueryBuilder("campana");

    if (filtros?.estado) {
      qb.andWhere("campana.estado = :estado", { estado: filtros.estado });
    }
    if (filtros?.fechaInicio) {
      qb.andWhere("campana.fecha_inicio >= :fechaInicio", { fechaInicio: filtros.fechaInicio });
    }
    if (filtros?.fechaFin) {
      qb.andWhere("(campana.fecha_fin IS NULL OR campana.fecha_fin <= :fechaFin)", {
        fechaFin: filtros.fechaFin,
      });
    }

    return qb.orderBy("campana.fecha_inicio", "DESC").getMany();
  },
});
