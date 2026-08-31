import { AppDataSource } from "../config/database";
import { Cita, EstadoCita } from "../entities/Cita.entity";

export const CitaRepository = AppDataSource.getRepository(Cita).extend({
  async buscarSolapamientoMedico(
    idMedico: number,
    fechaInicio: Date,
    fechaFin: Date,
    excludeCitaId?: number
  ): Promise<Cita | null> {
    const qb = this.createQueryBuilder("cita")
      .where("cita.id_medico = :idMedico", { idMedico })
      .andWhere("cita.estado != :cancelado", { cancelado: "CANCELADA" })
      .andWhere("cita.fecha_hora_inicio < :fechaFin AND cita.fecha_hora_fin > :fechaInicio", {
        fechaInicio,
        fechaFin,
      });

    if (excludeCitaId) {
      qb.andWhere("cita.id_cita != :excludeCitaId", { excludeCitaId });
    }

    return qb.getOne();
  },

  async buscarPorId(idCita: number): Promise<Cita | null> {
    return this.findOne({
      where: { idCita },
      relations: {
        paciente: { usuario: true },
        medico: { usuario: true, especialidades: true },
        consultorio: true,
      },
    });
  },

  async buscarPorPaciente(idPaciente: number): Promise<Cita[]> {
    return this.find({
      where: { paciente: { idPaciente } },
      relations: {
        paciente: { usuario: true },
        medico: { usuario: true, especialidades: true },
        consultorio: true,
      },
      order: { fechaHoraInicio: "ASC" },
    });
  },

  async buscarPorMedico(idMedico: number): Promise<Cita[]> {
    return this.find({
      where: { medico: { idMedico } },
      relations: {
        paciente: { usuario: true },
        medico: { usuario: true, especialidades: true },
        consultorio: true,
      },
      order: { fechaHoraInicio: "ASC" },
    });
  },

  async buscarTodas(filtros?: {
    idMedico?: number;
    idPaciente?: number;
    estado?: EstadoCita;
  }): Promise<Cita[]> {
    const where: any = {};
    if (filtros?.idMedico) where.medico = { idMedico: filtros.idMedico };
    if (filtros?.idPaciente) where.paciente = { idPaciente: filtros.idPaciente };
    if (filtros?.estado) where.estado = filtros.estado;

    return this.find({
      where,
      relations: {
        paciente: { usuario: true },
        medico: { usuario: true, especialidades: true },
        consultorio: true,
      },
      order: { fechaHoraInicio: "DESC" },
    });
  },
});
