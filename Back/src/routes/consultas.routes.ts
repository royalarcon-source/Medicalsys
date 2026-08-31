// src/routes/consultas.routes.ts
import { Router } from "express";
import { ConsultaController } from "../controllers/ConsultaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// HU-18: Listar atenciones / cola de atención
router.get("/", requirePermission("CONSULTA_GESTIONAR"), ConsultaController.listar);

// HU-18: Registrar atención sin cita (walk-in / sobrecupo)
router.post("/", requirePermission("CONSULTA_REGISTRAR"), ConsultaController.registrarSinCita);
router.post("/sin-cita", requirePermission("CONSULTA_REGISTRAR"), ConsultaController.registrarSinCita);

// HU-18: Actualizar estado de consulta (EN_ATENCION, ATENDIDA, CANCELADA)
router.patch("/:id/estado", requirePermission("CONSULTA_GESTIONAR"), ConsultaController.actualizarEstado);

export default router;
