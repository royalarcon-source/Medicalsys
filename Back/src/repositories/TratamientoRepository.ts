import { AppDataSource } from "../config/database";
import { Tratamiento } from "../entities/Tratamiento.entity";

export interface TratamientoItemDTO {
  descripcion: string;
  indicaciones?: string;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
}

export interface CrearTratamientoInput {
  idConsulta: number;
  descripcion: string;
  indicaciones?: string;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
}

export const TratamientoRepository = AppDataSource.getRepository(Tratamiento).extend({
  async crear(data: CrearTratamientoInput): Promise<Tratamiento> {
    const tratamiento = this.create({
      consulta: { idConsulta: data.idConsulta },
      descripcion: data.descripcion.trim(),
      indicaciones: data.indicaciones?.trim() || null,
      fechaInicio: data.fechaInicio ?? null,
      fechaFin: data.fechaFin ?? null,
    });

    return this.save(tratamiento);
  },

  async buscarPorId(idTratamiento: number): Promise<Tratamiento | null> {
    return this.findOne({
      where: { idTratamiento },
      relations: {
        consulta: {
          medico: { usuario: true },
          historia: { paciente: { usuario: true } },
        },
      },
    });
  },

  async crearParaConsulta(
    idConsulta: number,
    items: TratamientoItemDTO[]
  ): Promise<Tratamiento[]> {
    if (!items || items.length === 0) return [];

    const entities = items.map((item) =>
      this.create({
        consulta: { idConsulta },
        descripcion: item.descripcion.trim(),
        indicaciones: item.indicaciones?.trim() || null,
        fechaInicio: item.fechaInicio ? new Date(item.fechaInicio) : null,
        fechaFin: item.fechaFin ? new Date(item.fechaFin) : null,
      })
    );

    return this.save(entities);
  },

  async buscarPorConsulta(idConsulta: number): Promise<Tratamiento[]> {
    return this.find({
      where: { consulta: { idConsulta } },
      order: { idTratamiento: "DESC" },
    });
  },

  async listarTodos(): Promise<Tratamiento[]> {
    return this.find({
      relations: {
        consulta: {
          medico: { usuario: true },
          historia: { paciente: { usuario: true } },
        },
      },
      order: { idTratamiento: "DESC" },
    });
  },

  async listarPorMedico(idMedico: number): Promise<Tratamiento[]> {
    return this.createQueryBuilder("tratamiento")
      .leftJoinAndSelect("tratamiento.consulta", "consulta")
      .leftJoinAndSelect("consulta.medico", "medico")
      .leftJoinAndSelect("consulta.historia", "historia")
      .leftJoinAndSelect("historia.paciente", "paciente")
      .leftJoinAndSelect("paciente.usuario", "pacienteUsuario")
      .where("medico.idMedico = :idMedico", { idMedico })
      .orderBy("tratamiento.idTratamiento", "DESC")
      .getMany();
  },

  async listarPorPaciente(idPaciente: number): Promise<Tratamiento[]> {
    return this.createQueryBuilder("tratamiento")
      .leftJoinAndSelect("tratamiento.consulta", "consulta")
      .leftJoinAndSelect("consulta.historia", "historia")
      .leftJoinAndSelect("historia.paciente", "paciente")
      .leftJoinAndSelect("consulta.medico", "medico")
      .leftJoinAndSelect("medico.usuario", "medicoUsuario")
      .where("paciente.idPaciente = :idPaciente", { idPaciente })
      .orderBy("tratamiento.idTratamiento", "DESC")
      .getMany();
  },
});
