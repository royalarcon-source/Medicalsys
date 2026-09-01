import { AppDataSource } from "../config/database";
import { Consulta } from "../entities/Consulta.entity";
import { Tratamiento } from "../entities/Tratamiento.entity";
import { MedicoRepository } from "../repositories/MedicoRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { TratamientoRepository } from "../repositories/TratamientoRepository";
import { RegistrarTratamientoDTO, validarTratamientoDTO } from "../dtos/tratamiento/RegistrarTratamientoDTO";
import { AppError } from "../utils/AppError";

export class TratamientoService {
  private async obtenerConsulta(idConsulta: number): Promise<Consulta> {
    const consulta = await AppDataSource.getRepository(Consulta).findOne({
      where: { idConsulta },
      relations: {
        medico: { usuario: true },
        historia: { paciente: { usuario: true } },
      },
    });

    if (!consulta) {
      throw new AppError("La consulta indicada no existe.", 404);
    }

    if (!consulta.medico) {
      throw new AppError("La consulta no tiene un médico asignado.", 400);
    }

    return consulta;
  }

  private async validarMedicoPropio(usuarioActual: { idUsuario: number; rol: string }, idMedico: number) {
    const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
    if (!medico) {
      throw new AppError("No existe un perfil de médico asociado a tu usuario.", 403);
    }

    if (medico.idMedico !== idMedico) {
      throw new AppError("No tienes permiso para registrar tratamientos de otro médico.", 403);
    }
  }

  async registrar(dto: Partial<RegistrarTratamientoDTO>, usuarioActual: { idUsuario: number; rol: string }): Promise<Tratamiento> {
    const datos = validarTratamientoDTO(dto);
    const consulta = await this.obtenerConsulta(datos.idConsulta);

    if (usuarioActual.rol === "MEDICO") {
      await this.validarMedicoPropio(usuarioActual, consulta.medico.idMedico);
    } else if (usuarioActual.rol !== "ADMINISTRADOR") {
      throw new AppError("No tienes permiso para registrar tratamientos.", 403);
    }

    return TratamientoRepository.crear({
      idConsulta: consulta.idConsulta,
      descripcion: datos.descripcion,
      indicaciones: datos.indicaciones,
      fechaInicio: datos.fechaInicio ? new Date(`${datos.fechaInicio}T00:00:00.000Z`) : null,
      fechaFin: datos.fechaFin ? new Date(`${datos.fechaFin}T00:00:00.000Z`) : null,
    });
  }

  async listar(usuarioActual: { idUsuario: number; rol: string }): Promise<Tratamiento[]> {
    if (usuarioActual.rol === "ADMINISTRADOR") {
      return TratamientoRepository.listarTodos();
    }

    if (usuarioActual.rol === "MEDICO") {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico) {
        return [];
      }
      return TratamientoRepository.listarPorMedico(medico.idMedico);
    }

    if (usuarioActual.rol === "PACIENTE") {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) {
        return [];
      }
      return TratamientoRepository.listarPorPaciente(paciente.idPaciente);
    }

    throw new AppError("No tienes permiso para ver tratamientos.", 403);
  }

  async obtenerPorId(idTratamiento: number, usuarioActual: { idUsuario: number; rol: string }): Promise<Tratamiento> {
    const tratamiento = await TratamientoRepository.buscarPorId(idTratamiento);
    if (!tratamiento) {
      throw new AppError("El tratamiento indicado no existe.", 404);
    }

    if (usuarioActual.rol === "ADMINISTRADOR") {
      return tratamiento;
    }

    if (usuarioActual.rol === "MEDICO") {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico) {
        throw new AppError("No existe un perfil de médico asociado a tu usuario.", 403);
      }

      if (tratamiento.consulta.medico.idMedico !== medico.idMedico) {
        throw new AppError("No tienes permiso para ver este tratamiento.", 403);
      }

      return tratamiento;
    }

    if (usuarioActual.rol === "PACIENTE") {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) {
        throw new AppError("No existe un perfil de paciente asociado a tu usuario.", 403);
      }

      if (tratamiento.consulta.historia.paciente.idPaciente !== paciente.idPaciente) {
        throw new AppError("No tienes permiso para ver este tratamiento.", 403);
      }

      return tratamiento;
    }

    throw new AppError("No tienes permiso para ver tratamientos.", 403);
  }
}
