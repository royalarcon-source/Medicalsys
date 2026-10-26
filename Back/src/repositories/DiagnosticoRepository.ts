import { AppDataSource } from "../config/database";
import { Diagnostico } from "../entities/Diagnostico.entity";

export interface DiagnosticoItemDTO {
  codigo?: string;
  descripcion: string;
  tipo?: string;
}

export interface CrearDiagnosticoInput {
  idConsulta: number;
  codigo?: string;
  descripcion: string;
  tipo?: string;
}

export const DiagnosticoRepository = AppDataSource.getRepository(Diagnostico).extend({
  async crear(data: CrearDiagnosticoInput): Promise<Diagnostico> {
    const diagnostico = this.create({
      consulta: { idConsulta: data.idConsulta },
      codigo: data.codigo?.trim() || null,
      descripcion: data.descripcion.trim(),
      tipo: data.tipo?.trim() || "DEFINITIVO",
    });

    return this.save(diagnostico);
  },

  async buscarPorId(idDiagnostico: number): Promise<Diagnostico | null> {
    return this.findOne({
      where: { idDiagnostico },
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
    items: DiagnosticoItemDTO[]
  ): Promise<Diagnostico[]> {
    if (!items || items.length === 0) return [];

    const entities = items.map((item) =>
      this.create({
        consulta: { idConsulta },
        codigo: item.codigo?.trim() || null,
        descripcion: item.descripcion.trim(),
        tipo: item.tipo?.trim() || "DEFINITIVO",
      })
    );

    return this.save(entities);
  },

  async buscarPorConsulta(idConsulta: number): Promise<Diagnostico[]> {
    return this.find({
      where: { consulta: { idConsulta } },
      order: { idDiagnostico: "DESC" },
    });
  },

  async listarTodos(): Promise<Diagnostico[]> {
    return this.find({
      relations: {
        consulta: {
          medico: { usuario: true },
          historia: { paciente: { usuario: true } },
        },
      },
      order: { idDiagnostico: "DESC" },
    });
  },

  async listarPorMedico(idMedico: number): Promise<Diagnostico[]> {
    return this.createQueryBuilder("diagnostico")
      .leftJoinAndSelect("diagnostico.consulta", "consulta")
      .leftJoinAndSelect("consulta.medico", "medico")
      .leftJoinAndSelect("consulta.historia", "historia")
      .leftJoinAndSelect("historia.paciente", "paciente")
      .leftJoinAndSelect("paciente.usuario", "pacienteUsuario")
      .where("medico.idMedico = :idMedico", { idMedico })
      .orderBy("diagnostico.idDiagnostico", "DESC")
      .getMany();
  },

  async listarPorPaciente(idPaciente: number): Promise<Diagnostico[]> {
    return this.createQueryBuilder("diagnostico")
      .leftJoinAndSelect("diagnostico.consulta", "consulta")
      .leftJoinAndSelect("consulta.historia", "historia")
      .leftJoinAndSelect("historia.paciente", "paciente")
      .leftJoinAndSelect("consulta.medico", "medico")
      .leftJoinAndSelect("medico.usuario", "medicoUsuario")
      .where("paciente.idPaciente = :idPaciente", { idPaciente })
      .orderBy("diagnostico.idDiagnostico", "DESC")
      .getMany();
  },
});
