import { AppDataSource } from "../config/database";
import { Diagnostico } from "../entities/Diagnostico.entity";

export interface DiagnosticoItemDTO {
  codigo?: string;
  descripcion: string;
  tipo?: string;
}

export const DiagnosticoRepository = AppDataSource.getRepository(Diagnostico).extend({
  async crearParaConsulta(
    idConsulta: number,
    items: DiagnosticoItemDTO[]
  ): Promise<Diagnostico[]> {
    if (!items || items.length === 0) return [];

    const entities = items.map((item) =>
      this.create({
        consulta: { idConsulta },
        codigo: item.codigo || null,
        descripcion: item.descripcion.trim(),
        tipo: item.tipo || "DEFINITIVO",
      })
    );

    return this.save(entities);
  },

  async buscarPorConsulta(idConsulta: number): Promise<Diagnostico[]> {
    return this.find({
      where: { consulta: { idConsulta } },
    });
  },
});
