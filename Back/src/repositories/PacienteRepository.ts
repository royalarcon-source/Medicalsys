// src/repositories/PacienteRepository.ts
import { AppDataSource } from "../config/database";
import { Paciente } from "../entities/Paciente.entity";
import { ILike } from "typeorm";

export const PacienteRepository = AppDataSource.getRepository(Paciente).extend({
  async buscarPorId(idPaciente: number): Promise<Paciente | null> {
    return this.findOne({
      where: { idPaciente },
      relations: { usuario: true },
    });
  },

  async buscarPorCI(ci: string): Promise<Paciente | null> {
    return this.findOne({
      where: { documentoIdentidad: ci },
      relations: { usuario: true },
    });
  },

  async buscarPorCi(ci: string): Promise<Paciente | null> {
    return this.buscarPorCI(ci);
  },

  async buscarPorNombre(
    nombre: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ pacientes: Paciente[]; total: number }> {
    const termino = `%${nombre.trim()}%`;
    const [pacientes, total] = await this.findAndCount({
      where: { usuario: { nombres: ILike(termino) } },
      relations: { usuario: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { idPaciente: "ASC" },
    });

    return { pacientes, total };
  },

  async buscarPorApellido(
    apellido: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ pacientes: Paciente[]; total: number }> {
    const termino = `%${apellido.trim()}%`;
    const [pacientes, total] = await this.findAndCount({
      where: { usuario: { apellidos: ILike(termino) } },
      relations: { usuario: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { idPaciente: "ASC" },
    });

    return { pacientes, total };
  },

  async buscar(filtros: {
    ci?: string;
    nombre?: string;
    apellido?: string;
    page?: number;
    limit?: number;
  }): Promise<{ pacientes: Paciente[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filtros.page && filtros.page > 0 ? filtros.page : 1;
    const limit = filtros.limit && filtros.limit > 0 ? filtros.limit : 10;

    const query = this.createQueryBuilder("paciente")
      .leftJoinAndSelect("paciente.usuario", "usuario")
      .orderBy("paciente.idPaciente", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const condiciones: string[] = [];
    const parametros: Record<string, string> = {};

    if (filtros.ci && filtros.ci.trim()) {
      condiciones.push("paciente.documentoIdentidad = :ci");
      parametros.ci = filtros.ci.trim();
    }

    if (filtros.nombre && filtros.nombre.trim()) {
      condiciones.push("usuario.nombres ILIKE :nombre");
      parametros.nombre = `%${filtros.nombre.trim()}%`;
    }

    if (filtros.apellido && filtros.apellido.trim()) {
      condiciones.push("usuario.apellidos ILIKE :apellido");
      parametros.apellido = `%${filtros.apellido.trim()}%`;
    }

    if (condiciones.length === 0) {
      return { pacientes: [], total: 0, page, limit, totalPages: 0 };
    }

    query.where(condiciones.join(" AND "), parametros);

    const [pacientes, total] = await query.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return { pacientes, total, page, limit, totalPages };
  },

  async buscarPorUsuario(idUsuario: number): Promise<Paciente | null> {
    return this.findOne({
      where: { usuario: { idUsuario } },
      relations: { usuario: true },
    });
  },

  async crear(datos: {
    idUsuario: number;
    documentoIdentidad: string;
    fechaNacimiento: string;
    sexo?: string | null;
    direccion?: string | null;
    contactoEmergencia?: string | null;
    telefonoEmergencia?: string | null;
  }): Promise<Paciente> {
    const paciente = this.create({
      usuario: { idUsuario: datos.idUsuario },
      documentoIdentidad: datos.documentoIdentidad,
      fechaNacimiento: new Date(datos.fechaNacimiento),
      sexo: datos.sexo ?? null,
      direccion: datos.direccion ?? null,
      contactoEmergencia: datos.contactoEmergencia ?? null,
      telefonoEmergencia: datos.telefonoEmergencia ?? null,
    });
    return this.save(paciente);
  },
});
