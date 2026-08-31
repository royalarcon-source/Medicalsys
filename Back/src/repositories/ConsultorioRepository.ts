import { AppDataSource } from "../config/database";
import { Consultorio } from "../entities/Consultorio.entity";

export const ConsultorioRepository = AppDataSource.getRepository(Consultorio).extend({
  async listar(): Promise<Consultorio[]> {
    return this.find({ where: { activo: true }, order: { nombre: "ASC" } });
  },

  async buscarPorId(idConsultorio: number): Promise<Consultorio | null> {
    return this.findOne({ where: { idConsultorio, activo: true } });
  },

  async buscarSolapamiento(
    idConsultorio: number,
    fechaInicio: Date,
    fechaFin: Date,
    excludeCitaId?: number
  ): Promise<boolean> {
    const qb = AppDataSource.getRepository("cita")
      .createQueryBuilder("cita")
      .where("cita.id_consultorio = :idConsultorio", { idConsultorio })
      .andWhere("cita.estado != :cancelado", { cancelado: "CANCELADA" })
      .andWhere(
        "cita.fecha_hora_inicio < :fechaFin AND cita.fecha_hora_fin > :fechaInicio",
        { fechaInicio, fechaFin }
      );

    if (excludeCitaId) {
      qb.andWhere("cita.id_cita != :excludeCitaId", { excludeCitaId });
    }

    const count = await qb.getCount();
    return count > 0;
  },
});
