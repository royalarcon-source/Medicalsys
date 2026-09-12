import { AppDataSource } from "../config/database";
import { Notificacion } from "../entities/Notificacion.entity";
import { FiltroNotificacionesDTO } from "../dtos/notificacion.dto";

export const NotificacionRepository = AppDataSource.getRepository(Notificacion).extend({
  async buscarPorId(idNotificacion: number): Promise<Notificacion | null> {
    return this.findOne({
      where: { idNotificacion } as any,
      relations: {
        usuario: true,
        cita: {
          paciente: {
            usuario: true,
          },
          medico: {
            usuario: true,
          },
        },
      },
    });
  },

  async buscarPorUsuario(idUsuario: number): Promise<Notificacion[]> {
    return this.find({
      where: { usuario: { idUsuario } } as any,
      relations: {
        cita: true,
      },
      order: { fechaProgramada: "DESC" },
    });
  },

  async buscarPorCita(idCita: number): Promise<Notificacion[]> {
    return this.find({
      where: { cita: { idCita } } as any,
      order: { idNotificacion: "DESC" },
    });
  },

  async listar(filtros?: FiltroNotificacionesDTO): Promise<Notificacion[]> {
    const qb = this.createQueryBuilder("notificacion")
      .leftJoinAndSelect("notificacion.usuario", "usuario")
      .leftJoinAndSelect("notificacion.cita", "cita");

    if (filtros?.estado) {
      qb.andWhere("notificacion.estado = :estado", { estado: filtros.estado });
    }
    if (filtros?.canal) {
      qb.andWhere("notificacion.canal = :canal", { canal: filtros.canal });
    }
    if (filtros?.idCita) {
      qb.andWhere("cita.id_cita = :idCita", { idCita: filtros.idCita });
    }
    if (filtros?.idUsuario) {
      qb.andWhere("usuario.id_usuario = :idUsuario", { idUsuario: filtros.idUsuario });
    }

    return qb.orderBy("notificacion.id_notificacion", "DESC").getMany();
  },
});
