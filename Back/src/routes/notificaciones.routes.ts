import { Router } from "express";
import { NotificacionController } from "../controllers/notificacion.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();
const controller = new NotificacionController();

// HU-35: Enviar recordatorio WhatsApp
router.post("/:id/enviar-whatsapp", authenticateJWT, controller.enviarWhatsApp);

// Consultar notificaciones por cita
router.get("/cita/:idCita", authenticateJWT, controller.obtenerPorCita);

export default router;
