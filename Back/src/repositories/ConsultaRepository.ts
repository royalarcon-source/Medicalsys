import { Between } from "typeorm";
import { AppDataSource } from "../config/database";
import { Consulta, EstadoConsulta, TipoIngreso } from "../entities/Consulta.entity";

export const ConsultaRepository = AppDataSource.getRepository(Consulta).extend({
  async buscarPorId(idConsulta: number): Promise<Consulta | null> {
    return this.findOne({
      where: { idConsulta },
      relations: {
        historia: { paciente: { usuario: true } },
        medico: { usuario: true, especialidades: true },
        consultorio: true,
        cita: true,
      },
    });
  },

  async contarConsultasHoy(idMedico: number, fecha: Date = new Date()): Promise<number> {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    return this.count({
      where: {
        medico: { idMedico },
        fechaConsulta: Between(inicioDia, finDia),
      },
    });
  },

  async buscarTodas(filtros?: {
    idMedico?: number;
    idPaciente?: number;
    fecha?: string;
    estadoConsulta?: EstadoConsulta;
    tipoIngreso?: TipoIngreso;
  }): Promise<Consulta[]> {
    const qb = this.createQueryBuilder("consulta")
      .leftJoinAndSelect("consulta.historia", "historia")
      .leftJoinAndSelect("historia.paciente", "paciente")
      .leftJoinAndSelect("paciente.usuario", "pacienteUsuario")
      .leftJoinAndSelect("consulta.medico", "medico")
      .leftJoinAndSelect("medico.usuario", "medicoUsuario")
      .leftJoinAndSelect("medico.especialidades", "especialidades")
      .leftJoinAndSelect("consulta.consultorio", "consultorio")
      .leftJoinAndSelect("consulta.cita", "cita")
      .orderBy("consulta.fechaConsulta", "DESC")
      .addOrderBy("consulta.numeroTurno", "ASC");

    if (filtros?.idMedico) {
      qb.andWhere("medico.idMedico = :idMedico", { idMedico: filtros.idMedico });
    }

    if (filtros?.idPaciente) {
      qb.andWhere("paciente.idPaciente = :idPaciente", { idPaciente: filtros.idPaciente });
    }

    if (filtros?.estadoConsulta) {
      qb.andWhere("consulta.estadoConsulta = :estadoConsulta", {
        estadoConsulta: filtros.estadoConsulta,
      });
    }

    if (filtros?.tipoIngreso) {
      qb.andWhere("consulta.tipoIngreso = :tipoIngreso", {
        tipoIngreso: filtros.tipoIngreso,
      });
    }

    if (filtros?.fecha) {
      const inicio = new Date(`${filtros.fecha}T00:00:00.000Z`);
      const fin = new Date(`${filtros.fecha}T23:59:59.999Z`);
      qb.andWhere("consulta.fechaConsulta BETWEEN :inicio AND :fin", { inicio, fin });
    }

    return qb.getMany();
  },
});
