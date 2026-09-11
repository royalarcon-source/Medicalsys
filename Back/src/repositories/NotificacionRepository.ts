import { AppDataSource } from "../config/database";
import { Notificacion } from "../entities/Notificacion.entity";

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
});
