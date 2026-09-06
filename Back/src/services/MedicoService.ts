// src/services/MedicoService.ts
import { MedicoRepository } from "../repositories/MedicoRepository";
import { AppDataSource } from "../config/database";
import { Usuario } from "../entities/Usuario.entity";
import { Medico } from "../entities/Medico.entity";
import { RegistrarMedicoDTO } from "../dtos/medico/RegistrarMedicoDTO";
import { AppError } from "../utils/AppError";

const NOMBRE_ROL_MEDICO = "MEDICO";

export const MedicoService = {
  async registrar(datos: RegistrarMedicoDTO): Promise<Medico> {
    // CA-08: usuario debe existir
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({
      where: { idUsuario: datos.idUsuario },
      relations: { rol: true },
    });

    if (!usuario) {
      throw new AppError("El usuario indicado no existe", 404);
    }

    // CA-02: el usuario debe tener rol MEDICO
    if (usuario.rol.nombre !== NOMBRE_ROL_MEDICO) {
      throw new AppError(
        "El usuario no tiene rol MEDICO. Asigná el rol primero (HU-07).",
        400
      );
    }

    // CA-03: un usuario no puede tener más de un perfil de médico
    const medicoExistente = await MedicoRepository.buscarPorUsuario(datos.idUsuario);
    if (medicoExistente) {
      throw new AppError("Este usuario ya tiene un perfil de médico registrado", 409);
    }

    // CA-05: numero_colegiatura único
    const colegiaturaExistente = await MedicoRepository.buscarPorNumeroColegiatura(
      datos.numeroColegiatura
    );
    if (colegiaturaExistente) {
      throw new AppError("Ya existe un médico con ese número de colegiatura", 409);
    }

    return MedicoRepository.crear({
      usuarioId: datos.idUsuario,
      numeroColegiatura: datos.numeroColegiatura,
    });
  },

  async buscarPorId(idMedico: number): Promise<Medico> {
    const medico = await MedicoRepository.buscarPorId(idMedico);
    if (!medico) {
      throw new AppError("Médico no encontrado", 404);
    }
    return medico;
  },
  async buscarPorNumeroColegiatura(numeroColegiatura: string): Promise<Medico> {
  const medico = await MedicoRepository.buscarPorNumeroColegiatura(numeroColegiatura);
  if (!medico) {
    throw new AppError("No existe un médico con ese número de colegiatura", 404);
  }
  return medico;
},
};