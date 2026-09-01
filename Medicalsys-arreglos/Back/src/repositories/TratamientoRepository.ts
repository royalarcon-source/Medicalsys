import { AppDataSource } from "../config/database";
import { Tratamiento } from "../entities/Tratamiento.entity";

export interface TratamientoItemDTO {
  descripcion: string;
  indicaciones?: string;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
}

export const TratamientoRepository = AppDataSource.getRepository(Tratamiento).extend({
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
    });
  },
});
