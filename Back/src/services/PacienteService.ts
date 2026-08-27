import { AppDataSource } from "../config/database";
import { Usuario } from "../entities/Usuario.entity";
import { Paciente } from "../entities/Paciente.entity";
import { RegistrarPacienteDTO } from "../dtos/paciente/RegistrarPacienteDTO";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { AppError } from "../utils/AppError";

const NOMBRE_ROL_PACIENTE = "PACIENTE";

export const PacienteService = {
  async registrar(datos: RegistrarPacienteDTO): Promise<Paciente> {
    const usuario = await AppDataSource.getRepository(Usuario).findOne({
      where: { idUsuario: datos.idUsuario },
      relations: { rol: true },
    });

    if (!usuario) {
      throw new AppError("El usuario indicado no existe", 404);
    }

    if (usuario.rol.nombre !== NOMBRE_ROL_PACIENTE) {
      throw new AppError("El usuario no tiene rol PACIENTE", 400);
    }

    if (await PacienteRepository.buscarPorUsuario(datos.idUsuario)) {
      throw new AppError("Este usuario ya tiene un perfil de paciente registrado", 409);
    }

    if (await PacienteRepository.buscarPorDocumento(datos.documentoIdentidad)) {
      throw new AppError("Ya existe un paciente con ese documento de identidad", 409);
    }

    return PacienteRepository.crear(datos);
  },
};