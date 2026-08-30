import { Between, Not, LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "../config/database";
import { Cita } from "../entities/Cita.entity";

export const CitaRepository = AppDataSource.getRepository(Cita).extend({
  // Busca solapamientos excluyendo citas canceladas y la cita actual (si se está reprogramando)
  async findSolapamientoMedico(
    id_medico: string,
    fechaInicio: Date,
    fechaFin: Date,
    excludeCitaId?: string
  ) {
    const qb = this.createQueryBuilder("cita")
      .where("cita.id_medico = :id_medico", { id_medico })
      .andWhere("cita.estado != :cancelado", { cancelado: "CANCELADA" })
      .andWhere(
        "((cita.fecha_hora_inic < :fechaFin AND cita.fecha_hora_fin > :fechaInicio))",
        { fechaInicio, fechaFin }
      );

    if (excludeCitaId) {
      qb.andWhere("cita.id_cita != :excludeCitaId", { excludeCitaId });
    }

    return await qb.getOne();
  },

  async findByPaciente(id_paciente: string) {
    return await this.find({
      where: { id_paciente },
      relations: { medico: true, consultorio: true },
      order: { fecha_hora_inic: "ASC" },
    });
  },

  async findByMedico(id_medico: string) {
    return await this.find({
      where: { id_medico },
      relations: { paciente: true, consultorio: true },
      order: { fecha_hora_inic: "ASC" },
    });
  },
});
