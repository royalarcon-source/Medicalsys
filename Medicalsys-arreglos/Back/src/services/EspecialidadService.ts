// src/services/EspecialidadService.ts
import { EspecialidadRepository } from "../repositories/EspecialidadRepository";
import { MedicoRepository } from "../repositories/MedicoRepository";
import { Especialidad } from "../entities/Especialidad.entity";
import { CrearEspecialidadDTO } from "../dtos/especialidad/CrearEspecialidadDTO";
import { AsignarEspecialidadDTO } from "../dtos/especialidad/AsignarEspecialidadDTO";
import { AppError } from "../utils/AppError";

export const EspecialidadService = {
  async crear(datos: CrearEspecialidadDTO): Promise<Especialidad> {
    // CA-03: nombre único
    const existente = await EspecialidadRepository.buscarPorNombre(datos.nombre);
    if (existente) {
      throw new AppError("Ya existe una especialidad con ese nombre", 409);
    }

    const especialidad = EspecialidadRepository.create({
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
    });
    return EspecialidadRepository.save(especialidad);
  },

  async listar(): Promise<Especialidad[]> {
    return EspecialidadRepository.listarTodas();
  },

  async actualizar(id: number, datos: CrearEspecialidadDTO): Promise<Especialidad> {
    const especialidad = await EspecialidadRepository.findOne({ where: { idEspecialidad: id } });
    if (!especialidad) {
      throw new AppError("Especialidad no encontrada", 404);
    }

    // si cambia el nombre, revalidar unicidad (CA-03)
    if (datos.nombre !== especialidad.nombre) {
      const enUso = await EspecialidadRepository.buscarPorNombre(datos.nombre);
      if (enUso) {
        throw new AppError("Ya existe una especialidad con ese nombre", 409);
      }
    }

    especialidad.nombre = datos.nombre;
    especialidad.descripcion = datos.descripcion ?? null;
    return EspecialidadRepository.save(especialidad);
  },

  async asignarAMedico(idMedico: number, datos: AsignarEspecialidadDTO): Promise<void> {
    // CA-09: médico debe existir
    const medico = await MedicoRepository.buscarPorId(idMedico);
    if (!medico) {
      throw new AppError("Médico no encontrado", 404);
    }

    // CA-08: todas las especialidades deben existir
    const especialidades = await EspecialidadRepository.buscarPorIds(datos.idEspecialidades);
    if (especialidades.length !== datos.idEspecialidades.length) {
      throw new AppError("Una o más especialidades indicadas no existen", 400);
    }

    await MedicoRepository.asignarEspecialidades(idMedico, especialidades);
  },
};