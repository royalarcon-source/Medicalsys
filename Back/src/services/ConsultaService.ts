// src/services/ConsultaService.ts
import { ConsultaRepository } from "../repositories/ConsultaRepository";
import { HistoriaClinicaRepository } from "../repositories/HistoriaClinicaRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { MedicoRepository } from "../repositories/MedicoRepository";
import { ConsultorioRepository } from "../repositories/ConsultorioRepository";
import { Consulta, EstadoConsulta, TipoIngreso } from "../entities/Consulta.entity";
import { AppError } from "../utils/AppError";
import { AppDataSource } from "../config/database";

const LIMITE_SOBRECUPO_ALERTA = 3;

export interface RegistrarAtencionSinCitaDTO {
  idPaciente: number;
  idMedico: number;
  idConsultorio?: number;
  motivo: string;
  tipoIngreso?: TipoIngreso;
  confirmarSobrecupo?: boolean;
}

export class ConsultaService {
  async registrarSinCita(
    dto: RegistrarAtencionSinCitaDTO,
    usuarioActual: { idUsuario: number; rol: string }
  ): Promise<{ consulta: Consulta; ticket: { numeroTurno: number; mensaje: string; posCola: number } }> {
    if (!dto.idPaciente || !dto.idMedico || !dto.motivo?.trim()) {
      throw new AppError("Paciente, médico y motivo de consulta son campos obligatorios.", 400);
    }

    const paciente = await PacienteRepository.buscarPorId(dto.idPaciente);
    if (!paciente) {
      throw new AppError("El paciente indicado no existe.", 404);
    }

    const medico = await MedicoRepository.buscarPorId(dto.idMedico);
    if (!medico || !medico.activo) {
      throw new AppError("El médico seleccionado no existe o se encuentra inactivo.", 404);
    }

    let consultorio = null;
    if (dto.idConsultorio) {
      consultorio = await ConsultorioRepository.buscarPorId(dto.idConsultorio);
      if (!consultorio) {
        throw new AppError("El consultorio indicado no existe o está inactivo.", 404);
      }
    }

    // Validación y control de sobrecupo
    const hoy = new Date();
    const totalConsultasHoy = await ConsultaRepository.contarConsultasHoy(dto.idMedico, hoy);

    if (
      dto.tipoIngreso === "SOBRECUPO" &&
      totalConsultasHoy >= LIMITE_SOBRECUPO_ALERTA &&
      !dto.confirmarSobrecupo
    ) {
      throw new AppError(
        `El médico ha alcanzado el límite preventivo de ${LIMITE_SOBRECUPO_ALERTA} sobrecupos/atenciones para su turno. Se requiere confirmación para continuar.`,
        422
      );
    }

    // 1. Obtener o auto-crear Historia Clínica del paciente
    let historia = await HistoriaClinicaRepository.buscarPorPaciente(dto.idPaciente);
    if (!historia) {
      historia = await HistoriaClinicaRepository.crearParaPaciente(
        dto.idPaciente,
        "Apertura automática por atención espontánea/sin cita"
      );
    }

    // 2. Asignar número de turno en la lista de espera
    const numeroTurno = totalConsultasHoy + 1;
    const tipoIngreso: TipoIngreso = dto.tipoIngreso || "CONSULTA_ESPONTANEA";

    const nuevaConsulta = AppDataSource.getRepository(Consulta).create({
      historia,
      medico,
      consultorio,
      cita: null,
      fechaConsulta: hoy,
      motivo: dto.motivo.trim(),
      tipoIngreso,
      numeroTurno,
      estadoConsulta: "EN_ESPERA",
    });

    const guardada = await AppDataSource.getRepository(Consulta).save(nuevaConsulta);
    const consultaCompleta = (await ConsultaRepository.buscarPorId(guardada.idConsulta))!;

    return {
      consulta: consultaCompleta,
      ticket: {
        numeroTurno,
        posCola: numeroTurno,
        mensaje: `Turno #${numeroTurno} asignado exitosamente para el Dr(a). ${medico.usuario?.nombres} ${medico.usuario?.apellidos}.`,
      },
    };
  }

  async listar(
    filtros: {
      idMedico?: number;
      idPaciente?: number;
      fecha?: string;
      estadoConsulta?: EstadoConsulta;
      tipoIngreso?: TipoIngreso;
    },
    usuarioActual: { idUsuario: number; rol: string }
  ): Promise<Consulta[]> {
    if (usuarioActual.rol === "MEDICO") {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico) {
        return [];
      }
      filtros.idMedico = medico.idMedico;
    } else if (usuarioActual.rol === "PACIENTE") {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) {
        return [];
      }
      filtros.idPaciente = paciente.idPaciente;
    }

    return ConsultaRepository.buscarTodas(filtros);
  }

  async actualizarEstado(
    idConsulta: number,
    nuevoEstado: EstadoConsulta,
    usuarioActual: { idUsuario: number; rol: string }
  ): Promise<Consulta> {
    const consulta = await ConsultaRepository.buscarPorId(idConsulta);
    if (!consulta) {
      throw new AppError("La consulta indicada no existe.", 404);
    }

    if (usuarioActual.rol === "MEDICO") {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico || medico.idMedico !== consulta.medico.idMedico) {
        throw new AppError("No tienes permiso para gestionar la consulta de otro médico.", 403);
      }
    }

    consulta.estadoConsulta = nuevoEstado;
    await AppDataSource.getRepository(Consulta).save(consulta);

    return (await ConsultaRepository.buscarPorId(idConsulta))!;
  }
}
