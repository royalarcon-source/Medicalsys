import { CitaRepository } from "../repositories/CitaRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { MedicoRepository } from "../repositories/MedicoRepository";
import { AppDataSource } from "../config/database";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { ReservarCitaDTO, ReprogramarCitaDTO, CancelarCitaDTO, CitaFiltrosDTO } from "../dtos/cita.dto";
import { AppError } from "../utils/AppError";
import { Cita } from "../entities/Cita.entity";

const NOMBRE_ROL_PACIENTE = "PACIENTE";
const NOMBRE_ROL_MEDICO = "MEDICO";

export interface UsuarioAutenticado {
  idUsuario: number;
  rol: string;
}

export class CitaService {
  private horarioRepo = AppDataSource.getRepository(HorarioDisponibilidad);

  private async validarDisponibilidadHoraria(idMedico: number, inicio: Date, fin: Date): Promise<void> {
    const dayOfWeek = inicio.getDay();
    const diaSemana = dayOfWeek === 0 ? 7 : dayOfWeek;

    const horaInicioStr = `${String(inicio.getHours()).padStart(2, "0")}:${String(inicio.getMinutes()).padStart(2, "0")}:00`;
    const horaFinStr = `${String(fin.getHours()).padStart(2, "0")}:${String(fin.getMinutes()).padStart(2, "0")}:00`;

    const horario = await this.horarioRepo.findOne({
      where: {
        medico: { idMedico },
        diaSemana,
        activo: true,
      },
    });

    if (!horario) {
      throw new AppError("El médico no atiende en el día seleccionado", 400);
    }

    const horarioInicio = horario.horaInicio.length === 5 ? `${horario.horaInicio}:00` : horario.horaInicio;
    const horarioFin = horario.horaFin.length === 5 ? `${horario.horaFin}:00` : horario.horaFin;

    if (horaInicioStr < horarioInicio || horaFinStr > horarioFin) {
      throw new AppError(
        `El médico solo atiende de ${horarioInicio.slice(0, 5)} a ${horarioFin.slice(0, 5)}`,
        400
      );
    }
  }

  async reservar(dto: ReservarCitaDTO, usuarioActual: UsuarioAutenticado): Promise<Cita> {
    let idPaciente = dto.idPaciente ?? dto.id_paciente;
    const idMedico = dto.idMedico ?? dto.id_medico;
    const idConsultorio = dto.idConsultorio ?? dto.id_consultorio;

    if (usuarioActual.rol === NOMBRE_ROL_PACIENTE) {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) {
        throw new AppError("Registro de paciente no encontrado", 404);
      }
      idPaciente = paciente.idPaciente;
    }

    if (!idPaciente) {
      throw new AppError("El identificador del paciente es obligatorio", 400);
    }

    const pacienteExiste = await PacienteRepository.buscarPorId(idPaciente);
    if (!pacienteExiste) {
      throw new AppError("Paciente no encontrado", 404);
    }

    if (!idMedico) {
      throw new AppError("El identificador del médico es obligatorio", 400);
    }

    const medico = await MedicoRepository.buscarPorId(idMedico);
    if (!medico || !medico.activo) {
      throw new AppError("Médico no encontrado o inactivo", 404);
    }

    const inicioRaw = dto.fechaHoraInicio ?? dto.fecha_hora_inicio;
    const finRaw = dto.fechaHoraFin ?? dto.fecha_hora_fin;

    if (!inicioRaw || !finRaw) {
      throw new AppError("Las fechas de inicio y fin son obligatorias", 400);
    }

    const inicio = new Date(inicioRaw);
    const fin = new Date(finRaw);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio >= fin) {
      throw new AppError("Rango de fechas y horas inválido", 400);
    }

    if (inicio.getTime() < Date.now()) {
      throw new AppError("No se pueden agendar citas en fechas u horas pasadas", 400);
    }

    await this.validarDisponibilidadHoraria(idMedico, inicio, fin);

    const solapada = await CitaRepository.buscarSolapamientoMedico(idMedico, inicio, fin);
    if (solapada) {
      throw new AppError("El médico ya cuenta con una cita programada en ese horario", 409);
    }

    const nuevaCita = CitaRepository.create({
      paciente: { idPaciente },
      medico: { idMedico },
      consultorio: idConsultorio ? { idConsultorio } : null,
      fechaHoraInicio: inicio,
      fechaHoraFin: fin,
      motivo: (dto.motivo?.trim() || "Consulta médica general"),
      estado: "PENDIENTE",
    });

    const guardada = await CitaRepository.save(nuevaCita);
    return (await CitaRepository.buscarPorId(guardada.idCita))!;
  }

  async reprogramar(idCita: number, dto: ReprogramarCitaDTO, usuarioActual: UsuarioAutenticado): Promise<Cita> {
    const cita = await CitaRepository.buscarPorId(idCita);
    if (!cita) {
      throw new AppError("Cita médica no encontrada", 404);
    }

    if (cita.estado === "CANCELADA" || cita.estado === "ATENDIDA") {
      throw new AppError(`No se puede reprogramar una cita con estado ${cita.estado}`, 400);
    }

    if (usuarioActual.rol === NOMBRE_ROL_PACIENTE) {
      if (cita.paciente.usuario?.idUsuario !== usuarioActual.idUsuario) {
        throw new AppError("No tienes permisos para modificar esta cita", 403);
      }
    } else if (usuarioActual.rol === NOMBRE_ROL_MEDICO) {
      if (cita.medico.usuario?.idUsuario !== usuarioActual.idUsuario) {
        throw new AppError("No tienes permisos para modificar esta cita", 403);
      }
    }

    const inicioRaw = dto.fechaHoraInicio ?? dto.fecha_hora_inicio;
    const finRaw = dto.fechaHoraFin ?? dto.fecha_hora_fin;

    if (!inicioRaw || !finRaw) {
      throw new AppError("Las fechas de inicio y fin son obligatorias", 400);
    }

    const inicio = new Date(inicioRaw);
    const fin = new Date(finRaw);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio >= fin || inicio.getTime() < Date.now()) {
      throw new AppError("Rango de fecha y hora inválido o en el pasado", 400);
    }

    await this.validarDisponibilidadHoraria(cita.medico.idMedico, inicio, fin);

    const solapada = await CitaRepository.buscarSolapamientoMedico(cita.medico.idMedico, inicio, fin, idCita);
    if (solapada) {
      throw new AppError("El nuevo horario entra en conflicto con otra cita activa", 409);
    }

    cita.fechaHoraInicio = inicio;
    cita.fechaHoraFin = fin;
    if (dto.motivo !== undefined) {
      cita.motivo = dto.motivo.trim();
    }

    await CitaRepository.save(cita);
    return (await CitaRepository.buscarPorId(idCita))!;
  }

  async cancelar(idCita: number, _dto: CancelarCitaDTO, usuarioActual: UsuarioAutenticado): Promise<Cita> {
    const cita = await CitaRepository.buscarPorId(idCita);
    if (!cita) {
      throw new AppError("Cita no encontrada", 404);
    }

    if (cita.estado === "CANCELADA") {
      throw new AppError("La cita ya se encuentra cancelada", 400);
    }

    if (cita.estado === "ATENDIDA") {
      throw new AppError("No se puede cancelar una cita ya atendida", 400);
    }

    if (usuarioActual.rol === NOMBRE_ROL_PACIENTE) {
      if (cita.paciente.usuario?.idUsuario !== usuarioActual.idUsuario) {
        throw new AppError("No tienes autorización para cancelar esta cita", 403);
      }
    } else if (usuarioActual.rol === NOMBRE_ROL_MEDICO) {
      if (cita.medico.usuario?.idUsuario !== usuarioActual.idUsuario) {
        throw new AppError("No tienes autorización para cancelar esta cita", 403);
      }
    }

    cita.estado = "CANCELADA";
    await CitaRepository.save(cita);
    return (await CitaRepository.buscarPorId(idCita))!;
  }

  async listar(usuarioActual: UsuarioAutenticado, filtros?: CitaFiltrosDTO): Promise<Cita[]> {
    if (usuarioActual.rol === NOMBRE_ROL_PACIENTE) {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) return [];
      return CitaRepository.buscarPorPaciente(paciente.idPaciente);
    }

    if (usuarioActual.rol === NOMBRE_ROL_MEDICO) {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico) return [];
      return CitaRepository.buscarPorMedico(medico.idMedico);
    }

    return CitaRepository.buscarTodas(filtros as any);
  }

  async obtenerSlotsDisponibles(idMedico: number, fechaStr: string) {
    if (!idMedico || !fechaStr) {
      throw new AppError("idMedico y fecha son obligatorios", 400);
    }

    const [year, month, day] = fechaStr.split("-").map(Number);
    if (!year || !month || !day) {
      throw new AppError("Formato de fecha inválido. Usar YYYY-MM-DD", 400);
    }

    const fechaBase = new Date(year, month - 1, day);
    const dayOfWeek = fechaBase.getDay();
    const diaSemana = dayOfWeek === 0 ? 7 : dayOfWeek;

    const horario = await this.horarioRepo.findOne({
      where: {
        medico: { idMedico },
        diaSemana,
        activo: true,
      },
    });

    if (!horario) {
      return [];
    }

    const inicioDia = new Date(year, month - 1, day, 0, 0, 0);
    const finDia = new Date(year, month - 1, day, 23, 59, 59, 999);

    const citas = await CitaRepository.createQueryBuilder("cita")
      .where("cita.id_medico = :idMedico", { idMedico })
      .andWhere("cita.estado != :cancelado", { cancelado: "CANCELADA" })
      .andWhere("cita.fecha_hora_inicio < :finDia AND cita.fecha_hora_fin > :inicioDia", {
        inicioDia,
        finDia,
      })
      .getMany();

    const [hInicioH, hInicioM] = horario.horaInicio.slice(0, 5).split(":").map(Number);
    const [hFinH, hFinM] = horario.horaFin.slice(0, 5).split(":").map(Number);

    const minutosInicioTotal = hInicioH * 60 + hInicioM;
    const minutosFinTotal = hFinH * 60 + hFinM;
    const duracionSlotMinutos = 30;

    const slots = [];
    const ahora = Date.now();

    for (let m = minutosInicioTotal; m + duracionSlotMinutos <= minutosFinTotal; m += duracionSlotMinutos) {
      const slotStartH = Math.floor(m / 60);
      const slotStartM = m % 60;
      const slotEndH = Math.floor((m + duracionSlotMinutos) / 60);
      const slotEndM = (m + duracionSlotMinutos) % 60;

      const slotStartDate = new Date(year, month - 1, day, slotStartH, slotStartM, 0, 0);
      const slotEndDate = new Date(year, month - 1, day, slotEndH, slotEndM, 0, 0);

      const horaInicio = `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`;
      const horaFin = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`;

      const haySolapamiento = citas.some((c) => {
        const cIni = new Date(c.fechaHoraInicio).getTime();
        const cFin = new Date(c.fechaHoraFin).getTime();
        return slotStartDate.getTime() < cFin && slotEndDate.getTime() > cIni;
      });

      const esPasado = slotStartDate.getTime() < ahora;
      const disponible = !haySolapamiento && !esPasado;

      slots.push({
        horaInicio,
        horaFin,
        fechaHoraInicio: slotStartDate.toISOString(),
        fechaHoraFin: slotEndDate.toISOString(),
        disponible,
        estado: haySolapamiento ? "OCUPADO" : esPasado ? "PASADO" : "DISPONIBLE",
      });
    }

    return slots;
  }
}

export const citaService = new CitaService();
