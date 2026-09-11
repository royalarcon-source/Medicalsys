import { AppDataSource } from "../config/database";
import { Consulta } from "../entities/Consulta.entity";
import { Diagnostico } from "../entities/Diagnostico.entity";
import { Medico } from "../entities/Medico.entity";
import { Paciente } from "../entities/Paciente.entity";
import { DiagnosticoRepository } from "../repositories/DiagnosticoRepository";
import { MedicoRepository } from "../repositories/MedicoRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { RegistrarDiagnosticoDTO, validarDiagnosticoDTO } from "../dtos/diagnostico/RegistrarDiagnosticoDTO";
import { AppError } from "../utils/AppError";

export class DiagnosticoService {
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
      throw new AppError("No tienes permiso para registrar diagnósticos de otro médico.", 403);
    }
  }

  private async validarPacientePropio(usuarioActual: { idUsuario: number; rol: string }, idPaciente: number) {
    const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
    if (!paciente) {
      throw new AppError("No existe un perfil de paciente asociado a tu usuario.", 403);
    }

    if (paciente.idPaciente !== idPaciente) {
      throw new AppError("No tienes permiso para ver diagnósticos de otro paciente.", 403);
    }
  }

  async registrar(dto: Partial<RegistrarDiagnosticoDTO>, usuarioActual: { idUsuario: number; rol: string }): Promise<Diagnostico> {
    const datos = validarDiagnosticoDTO(dto);
    const consulta = await this.obtenerConsulta(datos.idConsulta);

    if (usuarioActual.rol === "MEDICO") {
      await this.validarMedicoPropio(usuarioActual, consulta.medico.idMedico);
    } else if (usuarioActual.rol !== "ADMINISTRADOR") {
      throw new AppError("No tienes permiso para registrar diagnósticos.", 403);
    }

    return DiagnosticoRepository.crear({
      idConsulta: consulta.idConsulta,
      codigo: datos.codigo,
      descripcion: datos.descripcion,
      tipo: datos.tipo,
    });
  }

  async listar(usuarioActual: { idUsuario: number; rol: string }): Promise<Diagnostico[]> {
    if (usuarioActual.rol === "ADMINISTRADOR") {
      return DiagnosticoRepository.listarTodos();
    }

    if (usuarioActual.rol === "MEDICO") {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico) {
        return [];
      }
      return DiagnosticoRepository.listarPorMedico(medico.idMedico);
    }

    if (usuarioActual.rol === "PACIENTE") {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) {
        return [];
      }
      return DiagnosticoRepository.listarPorPaciente(paciente.idPaciente);
    }

    throw new AppError("No tienes permiso para ver diagnósticos.", 403);
  }

  async obtenerPorId(idDiagnostico: number, usuarioActual: { idUsuario: number; rol: string }): Promise<Diagnostico> {
    const diagnostico = await DiagnosticoRepository.buscarPorId(idDiagnostico);
    if (!diagnostico) {
      throw new AppError("El diagnóstico indicado no existe.", 404);
    }

    if (usuarioActual.rol === "ADMINISTRADOR") {
      return diagnostico;
    }

    if (usuarioActual.rol === "MEDICO") {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico) {
        throw new AppError("No existe un perfil de médico asociado a tu usuario.", 403);
      }

      if (diagnostico.consulta.medico.idMedico !== medico.idMedico) {
        throw new AppError("No tienes permiso para ver este diagnóstico.", 403);
      }

      return diagnostico;
    }

    if (usuarioActual.rol === "PACIENTE") {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) {
        throw new AppError("No existe un perfil de paciente asociado a tu usuario.", 403);
      }

      if (diagnostico.consulta.historia.paciente.idPaciente !== paciente.idPaciente) {
        throw new AppError("No tienes permiso para ver este diagnóstico.", 403);
      }

      return diagnostico;
    }

    throw new AppError("No tienes permiso para ver diagnósticos.", 403);
  }
}
