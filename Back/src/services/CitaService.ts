import { CitaRepository } from "../repositories/CitaRepository";
import { AppDataSource } from "../config/database";
import { Paciente } from "../entities/Paciente.entity";
import { Medico } from "../entities/Medico.entity";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { ReservarCitaDTO, ReprogramarCitaDTO, CancelarCitaDTO } from "../dtos/cita.dto";
import { RolNombre } from "../entities/Rol.entity";

export class CitaService {
  private horarioRepo = AppDataSource.getRepository(HorarioDisponibilidad);
  private pacienteRepo = AppDataSource.getRepository(Paciente);
  private medicoRepo = AppDataSource.getRepository(Medico);

  private async validarDisponibilidadHoraria(id_medico: string, inicio: Date, fin: Date) {
    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const diaSemana = inicio.getDay();
    const horaInicioStr = inicio.toTimeString().split(" ")[0]; // "HH:MM:SS"
    const horaFinStr = fin.toTimeString().split(" ")[0];

    // Verificar si el médico tiene turno configurado
    const horario = await this.horarioRepo.findOne({
      where: {
        id_medico,
        dia_semana: diaSemana,
        activo: true,
      },
    });

    if (!horario) {
      throw { status: 400, message: "El médico no atiende en el día seleccionado." };
    }

    if (horaInicioStr < horario.hora_inicio || horaFinStr > horario.hora_fin) {
      throw { status: 400, message: `El médico solo atiende de ${horario.hora_inicio} a ${horario.hora_fin}.` };
    }
  }

  // HU-15: Reservar Cita
  async reservar(dto: ReservarCitaDTO, userReq: { id_usuario: string; roles: RolNombre[] }) {
    let id_paciente = dto.id_paciente;

    // Si es PACIENTE, resolver su id_paciente a partir de su id_usuario en el token
    if (userReq.roles.includes(RolNombre.PACIENTE)) {
      const paciente = await this.pacienteRepo.findOne({ where: { id_usuario: userReq.id_usuario } });
      if (!paciente) throw { status: 404, message: "Registro de paciente no encontrado." };
      id_paciente = paciente.id_paciente;
    }

    if (!id_paciente) {
      throw { status: 400, message: "El identificador del paciente es obligatorio." };
    }

    const inicio = new Date(dto.fecha_hora_inicio);
    const fin = new Date(dto.fecha_hora_fin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio >= fin) {
      throw { status: 400, message: "Rango de fechas y horas inválido." };
    }

    if (inicio < new Date()) {
      throw { status: 400, message: "No se pueden agendar citas en fechas u horas pasadas." };
    }

    // 1. Validar que el médico esté disponible según su horario semanal
    await this.validarDisponibilidadHoraria(dto.id_medico, inicio, fin);

    // 2. Validar que no haya solapamiento con otra cita activa
    const solapada = await CitaRepository.findSolapamientoMedico(dto.id_medico, inicio, fin);
    if (solapada) {
      throw { status: 409, message: "El médico ya cuenta con una cita programada en ese horario." };
    }

    const nuevaCita = CitaRepository.create({
      id_paciente,
      id_medico: dto.id_medico,
      id_consultorio: dto.id_consultorio,
      fecha_hora_inic: inicio,
      fecha_hora_fin: fin,
      motivo: dto.motivo || "Consulta médica general",
      estado: "PROGRAMADA",
    });

    return await CitaRepository.save(nuevaCita);
  }

  // HU-16: Reprogramar Cita
  async reprogramar(id_cita: string, dto: ReprogramarCitaDTO, userReq: { id_usuario: string; roles: RolNombre[] }) {
    const cita = await CitaRepository.findOne({ where: { id_cita } });
    if (!cita) throw { status: 404, message: "Cita médica no encontrada." };

    if (cita.estado === "CANCELADA" || cita.estado === "ATENDIDA") {
      throw { status: 400, message: `No se puede reprogramar una cita con estado ${cita.estado}.` };
    }

    // Aislamiento: El paciente solo reprograma sus propias citas
    if (userReq.roles.includes(RolNombre.PACIENTE)) {
      const paciente = await this.pacienteRepo.findOne({ where: { id_usuario: userReq.id_usuario } });
      if (!paciente || cita.id_paciente !== paciente.id_paciente) {
        throw { status: 403, message: "No tiene permisos para modificar esta cita." };
      }
    }

    const inicio = new Date(dto.fecha_hora_inicio);
    const fin = new Date(dto.fecha_hora_fin);

    if (inicio < new Date() || inicio >= fin) {
      throw { status: 400, message: "Rango de fecha y hora inválido o en el pasado." };
    }

    await this.validarDisponibilidadHoraria(cita.id_medico, inicio, fin);

    const solapada = await CitaRepository.findSolapamientoMedico(cita.id_medico, inicio, fin, id_cita);
    if (solapada) {
      throw { status: 409, message: "El nuevo horario entra en conflicto con otra cita activa." };
    }

    cita.fecha_hora_inic = inicio;
    cita.fecha_hora_fin = fin;
    if (dto.motivo) cita.motivo = dto.motivo;

    return await CitaRepository.save(cita);
  }

  // HU-16: Cancelar Cita
  async cancelar(id_cita: string, dto: CancelarCitaDTO, userReq: { id_usuario: string; roles: RolNombre[] }) {
    const cita = await CitaRepository.findOne({ where: { id_cita } });
    if (!cita) throw { status: 404, message: "Cita no encontrada." };

    if (cita.estado === "CANCELADA") {
      throw { status: 400, message: "La cita ya se encuentra cancelada." };
    }

    if (userReq.roles.includes(RolNombre.PACIENTE)) {
      const paciente = await this.pacienteRepo.findOne({ where: { id_usuario: userReq.id_usuario } });
      if (!paciente || cita.id_paciente !== paciente.id_paciente) {
        throw { status: 403, message: "No tiene autorización para cancelar esta cita." };
      }
    }

    cita.estado = "CANCELADA";
    return await CitaRepository.save(cita);
  }

  // Consultar Citas
  async listar(userReq: { id_usuario: string; roles: RolNombre[] }) {
    if (userReq.roles.includes(RolNombre.PACIENTE)) {
      const paciente = await this.pacienteRepo.findOne({ where: { id_usuario: userReq.id_usuario } });
      if (!paciente) return [];
      return await CitaRepository.findByPaciente(paciente.id_paciente);
    }

    if (userReq.roles.includes(RolNombre.MEDICO)) {
      const medico = await this.medicoRepo.findOne({ where: { id_usuario: userReq.id_usuario } });
      if (!medico) return [];
      return await CitaRepository.findByMedico(medico.id_medico);
    }

    return await CitaRepository.find({
      relations: { paciente: true, medico: true, consultorio: true },
      order: { fecha_hora_inic: "DESC" },
    });
  }
}
