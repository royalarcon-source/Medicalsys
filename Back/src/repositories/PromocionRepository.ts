import { AppDataSource } from "../config/database";
import { Promocion } from "../entities/Promocion.entity";
import { FiltroPromocionesDTO } from "../dtos/promocion.dto";

export const PromocionRepository = AppDataSource.getRepository(Promocion).extend({
  async buscarPorId(idPromocion: number): Promise<Promocion | null> {
    return this.findOne({ where: { idPromocion }, relations: { campana: true } });
  },

  async listar(filtros?: FiltroPromocionesDTO): Promise<Promocion[]> {
    const qb = this.createQueryBuilder("promocion").leftJoinAndSelect("promocion.campana", "campana");

    if (filtros?.idCampana) {
      qb.andWhere("campana.id_campana = :idCampana", { idCampana: filtros.idCampana });
    }
    if (filtros?.activa !== undefined) {
      qb.andWhere("promocion.activa = :activa", { activa: filtros.activa });
    }
    if (filtros?.vigente) {
      qb.andWhere("promocion.fecha_inicio <= CURRENT_DATE")
        .andWhere("(promocion.fecha_fin IS NULL OR promocion.fecha_fin >= CURRENT_DATE)");
    }

    return qb.orderBy("promocion.fecha_inicio", "DESC").getMany();
  },
});
