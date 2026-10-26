import { Router } from "express";
import { NotificacionController } from "../controllers/notificacion.controller";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();
const controller = new NotificacionController();

// HU-36: Listar notificaciones con filtros (un PACIENTE solo ve las suyas)
router.get("/", requirePermission("NOTIFICACION_VER"), controller.listar);

// Consultar notificaciones por cita
router.get("/cita/:idCita", requirePermission("NOTIFICACION_VER"), controller.obtenerPorCita);

// HU-36: Consultar notificación por ID
router.get("/:id", requirePermission("NOTIFICACION_VER"), controller.obtenerPorId);

// HU-35: Enviar recordatorio WhatsApp
router.post("/:id/enviar-whatsapp", requirePermission("NOTIFICACION_GESTIONAR"), controller.enviarWhatsApp);

// HU-36: Registrar (actualizar) el estado de una notificación
router.patch("/:id/estado", requirePermission("NOTIFICACION_GESTIONAR"), controller.registrarEstado);

export default router;
