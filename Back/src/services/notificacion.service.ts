import { NotificacionRepository } from "../repositories/NotificacionRepository";
import { Cita } from "../entities/Cita.entity";
import { Notificacion } from "../entities/Notificacion.entity";
import { AppError } from "../utils/AppError";
import { EstadoNotificacion, FiltroNotificacionesDTO, RegistrarEstadoNotificacionDTO } from "../dtos/notificacion.dto";

type UsuarioAutenticado = { idUsuario: number; rol: string };

// HU-36: transiciones válidas del ciclo de vida de una notificación
const TRANSICIONES_VALIDAS: Record<EstadoNotificacion, EstadoNotificacion[]> = {
  PENDIENTE: ["ENVIADA", "FALLIDA", "CANCELADA"],
  ENVIADA: ["FALLIDA"],
  FALLIDA: [],
  CANCELADA: [],
};

export class NotificacionService {
  // HU-34: Generar notificación de cita
  async generarNotificacionCita(cita: Cita) {
    if (!cita.paciente?.usuario) {
      throw new AppError("El paciente no cuenta con usuario vinculado para notificaciones", 400);
    }

    const fechaStr = new Date(cita.fechaHoraInicio).toLocaleString("es-BO", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const nombreMedico = cita.medico?.usuario
      ? `Dr(a). ${cita.medico.usuario.nombres} ${cita.medico.usuario.apellidos}`
      : "su médico asignado";

    const mensaje = `Hola ${cita.paciente.usuario.nombres}, le recordamos su cita médica con ${nombreMedico} programada para el día ${fechaStr}. Motivo: ${cita.motivo || "Consulta general"}. MedicalSys.`;

    const notificacion = NotificacionRepository.create({
      usuario: cita.paciente.usuario,
      cita,
      canal: "WHATSAPP",
      tipo: "RECORDATORIO_CITA",
      mensaje,
      estado: "PENDIENTE",
      fechaProgramada: new Date(),
      fechaEnvio: null,
    });

    return await NotificacionRepository.save(notificacion);
  }

  // HU-36: Registrar (actualizar) el estado de una notificación validando la máquina de estados
  async registrarEstado(
    idNotificacion: number,
    dto: RegistrarEstadoNotificacionDTO
  ): Promise<Notificacion> {
    const notificacion = await NotificacionRepository.buscarPorId(idNotificacion);
    if (!notificacion) {
      throw new AppError("Notificación no encontrada", 404);
    }

    const estadoActual = notificacion.estado as EstadoNotificacion;
    const permitidos = TRANSICIONES_VALIDAS[estadoActual] ?? [];

    if (!permitidos.includes(dto.estado)) {
      throw new AppError(
        `No se puede cambiar la notificación de "${estadoActual}" a "${dto.estado}".`,
        400
      );
    }

    notificacion.estado = dto.estado;
    if (dto.estado === "ENVIADA") {
      notificacion.fechaEnvio = new Date();
    }

    return NotificacionRepository.save(notificacion);
  }

  // HU-35: Enviar recordatorio por WhatsApp
  async enviarRecordatorioWhatsApp(idNotificacion: number) {
    const notificacion = await NotificacionRepository.buscarPorId(idNotificacion);
    if (!notificacion) {
      throw new AppError("Notificación no encontrada", 404);
    }

    if (notificacion.estado === "ENVIADA") {
      throw new AppError("Esta notificación ya fue enviada previamente", 400);
    }

    // Teléfono: prioridad teléfono de usuario, alternativo teléfono de emergencia
    const telefono =
      notificacion.usuario.telefono ||
      notificacion.cita?.paciente?.telefonoEmergencia;

    if (!telefono) {
      // HU-36: registrar el fallo de envío en el estado de la notificación
      await this.registrarEstado(idNotificacion, { estado: "FALLIDA", motivo: "Sin número telefónico registrado" });
      throw new AppError("El paciente no tiene un número telefónico registrado", 400);
    }

    const numeroLimpio = telefono.replace(/\D/g, "");
    const enlaceWhatsApp = `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${encodeURIComponent(
      notificacion.mensaje
    )}`;

    // HU-36: registrar el envío exitoso como cambio de estado validado
    const actualizada = await this.registrarEstado(idNotificacion, { estado: "ENVIADA" });

    return {
      mensaje: "Recordatorio de WhatsApp procesado exitosamente.",
      notificacion: actualizada,
      telefonoDestino: numeroLimpio,
      enlaceWhatsApp,
    };
  }

  // HU-36: cancelar automáticamente las notificaciones pendientes de una cita cancelada
  async cancelarPendientesPorCita(idCita: number): Promise<void> {
    const notificaciones = await NotificacionRepository.buscarPorCita(idCita);
    for (const notificacion of notificaciones.filter((n) => n.estado === "PENDIENTE")) {
      await this.registrarEstado(notificacion.idNotificacion, { estado: "CANCELADA", motivo: "Cita cancelada" });
    }
  }

  async listarPorCita(idCita: number) {
    return await NotificacionRepository.buscarPorCita(idCita);
  }

  // HU-36: listado con filtros; un PACIENTE solo puede ver sus propias notificaciones
  async listar(filtros: FiltroNotificacionesDTO = {}, authUser?: UsuarioAutenticado): Promise<Notificacion[]> {
    if (authUser?.rol === "PACIENTE") {
      filtros.idUsuario = authUser.idUsuario;
    }
    return NotificacionRepository.listar(filtros);
  }

  // HU-36: consulta por ID con la misma restricción de propiedad para PACIENTE
  async obtenerPorId(idNotificacion: number, authUser?: UsuarioAutenticado): Promise<Notificacion> {
    const notificacion = await NotificacionRepository.buscarPorId(idNotificacion);
    if (!notificacion) {
      throw new AppError("Notificación no encontrada", 404);
    }

    if (authUser?.rol === "PACIENTE" && notificacion.usuario.idUsuario !== authUser.idUsuario) {
      throw new AppError("Acceso denegado: solo puede consultar sus propias notificaciones.", 403);
    }

    return notificacion;
  }
}

export const notificacionService = new NotificacionService();
