// src/repositories/HorarioDisponibilidadRepository.ts
import { AppDataSource } from "../config/database";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { BuscarDisponibilidadDTO } from "../dtos/disponibilidad/DisponibilidadDTO";

export const HorarioDisponibilidadRepository = AppDataSource.getRepository(HorarioDisponibilidad).extend({
  async buscarPorId(idHorario: number): Promise<HorarioDisponibilidad | null> {
    return this.findOne({
      where: { idHorario },
      relations: { medico: { usuario: true } },
    });
  },

  async buscarPorMedico(idMedico: number, soloActivos = true): Promise<HorarioDisponibilidad[]> {
    return this.find({
      where: soloActivos ? { medico: { idMedico }, activo: true } : { medico: { idMedico } },
      order: { diaSemana: "ASC", horaInicio: "ASC" },
    });
  },

  async buscarSolapado(
    idMedico: number,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    excluirId?: number
  ): Promise<HorarioDisponibilidad | null> {
    const query = this.createQueryBuilder("horario")
      .where("horario.medico = :idMedico", { idMedico })
      .andWhere("horario.diaSemana = :diaSemana", { diaSemana })
      .andWhere("horario.activo = true")
      .andWhere("horario.horaInicio < :horaFin", { horaFin })
      .andWhere("horario.horaFin > :horaInicio", { horaInicio });

    if (excluirId) {
      query.andWhere("horario.idHorario != :excluirId", { excluirId });
    }

    return query.getOne();
  },

  async buscar(filtros: BuscarDisponibilidadDTO): Promise<HorarioDisponibilidad[]> {
    const query = this.createQueryBuilder("horario")
      .innerJoinAndSelect("horario.medico", "medico")
      .leftJoinAndSelect("medico.usuario", "usuario")
      .leftJoinAndSelect("medico.especialidades", "especialidad")
      .where("horario.activo = true")
      .andWhere("medico.activo = true")
      .orderBy("horario.diaSemana", "ASC")
      .addOrderBy("horario.horaInicio", "ASC");

    if (filtros.idMedico) {
      query.andWhere("medico.idMedico = :idMedico", { idMedico: filtros.idMedico });
    }

    if (filtros.diaSemana) {
      query.andWhere("horario.diaSemana = :diaSemana", { diaSemana: filtros.diaSemana });
    }

    if (filtros.idEspecialidad) {
      query.andWhere(
        "medico.idMedico IN (SELECT me.id_medico FROM medico_especialidad me WHERE me.id_especialidad = :idEspecialidad)",
        { idEspecialidad: filtros.idEspecialidad }
      );
    }

    return query.getMany();
  },

  async crear(datos: {
    idMedico: number;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
  }): Promise<HorarioDisponibilidad> {
    const horario = this.create({
      medico: { idMedico: datos.idMedico },
      diaSemana: datos.diaSemana,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
    });
    return this.save(horario);
  },

  async actualizar(
    horario: HorarioDisponibilidad,
    cambios: { diaSemana?: number; horaInicio?: string; horaFin?: string; activo?: boolean }
  ): Promise<HorarioDisponibilidad> {
    if (cambios.diaSemana !== undefined) horario.diaSemana = cambios.diaSemana;
    if (cambios.horaInicio !== undefined) horario.horaInicio = cambios.horaInicio;
    if (cambios.horaFin !== undefined) horario.horaFin = cambios.horaFin;
    if (cambios.activo !== undefined) horario.activo = cambios.activo;
    return this.save(horario);
  },
});
