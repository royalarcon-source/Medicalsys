import { AppDataSource } from "../config/database";
import { AtencionServicio } from "../entities/AtencionServicio.entity";

export const AtencionServicioRepository = AppDataSource.getRepository(AtencionServicio).extend({
  async buscarPorId(idAtencionServicio: number): Promise<AtencionServicio | null> {
    return this.findOne({
      where: { idAtencionServicio },
      relations: {
        consulta: true,
        paciente: {
          usuario: true,
        },
        servicio: true,
        factura: true,
      },
    });
  },

  async listarPorConsulta(idConsulta: number): Promise<AtencionServicio[]> {
    return this.find({
      where: { consulta: { idConsulta } },
      relations: {
        servicio: true,
        factura: true,
        paciente: {
          usuario: true,
        },
      },
      order: { idAtencionServicio: "ASC" },
    });
  },

  async listarPorPaciente(idPaciente: number, estado?: string): Promise<AtencionServicio[]> {
    const whereCondition: any = { paciente: { idPaciente } };
    if (estado) {
      whereCondition.estado = estado;
    }

    return this.find({
      where: whereCondition,
      relations: {
        servicio: true,
        factura: true,
        consulta: {
          medico: {
            usuario: true,
          },
        },
      },
      order: { fechaRegistro: "DESC" },
    });
  },
});

