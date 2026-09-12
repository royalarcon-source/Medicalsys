import { NotificacionRepository } from "../repositories/NotificacionRepository";
import { Cita } from "../entities/Cita.entity";
import { AppError } from "../utils/AppError";

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
      notificacion.estado = "FALLIDA";
      await NotificacionRepository.save(notificacion);
      throw new AppError("El paciente no tiene un número telefónico registrado", 400);
    }

    const numeroLimpio = telefono.replace(/\D/g, "");
    const enlaceWhatsApp = `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${encodeURIComponent(
      notificacion.mensaje
    )}`;

    // Marcamos como enviada
    notificacion.estado = "ENVIADA";
    notificacion.fechaEnvio = new Date();
    const actualizada = await NotificacionRepository.save(notificacion);

    return {
      mensaje: "Recordatorio de WhatsApp procesado exitosamente.",
      notificacion: actualizada,
      telefonoDestino: numeroLimpio,
      enlaceWhatsApp,
    };
  }

  async listarPorCita(idCita: number) {
    return await NotificacionRepository.buscarPorCita(idCita);
  }
}

export const notificacionService = new NotificacionService();
