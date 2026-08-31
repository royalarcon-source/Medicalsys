// src/routes/citas.routes.ts
import { Router } from "express";
import { CitaController } from "../controllers/CitaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// HU-15 / HU-16: Listar citas
router.get("/", requirePermission("CITA_CONSULTAR"), CitaController.listar);

// HU-15: Consultar slots de disponibilidad de un médico en una fecha específica
router.get("/slots", requirePermission("CITA_RESERVAR"), CitaController.obtenerSlots);

// HU-15: Reservar cita
router.post("/", requirePermission("CITA_RESERVAR"), CitaController.reservar);

// HU-16: Reprogramar cita
router.patch("/:id/reprogramar", requirePermission("CITA_GESTIONAR"), CitaController.reprogramar);
router.put("/:id/reprogramar", requirePermission("CITA_GESTIONAR"), CitaController.reprogramar);

// HU-16: Cancelar cita
router.patch("/:id/cancelar", requirePermission("CITA_GESTIONAR"), CitaController.cancelar);
router.delete("/:id", requirePermission("CITA_GESTIONAR"), CitaController.cancelar);

// HU-17: Asignar y liberar consultorio de cita
router.patch("/:id/asignar-consultorio", requirePermission("CONSULTORIO_GESTIONAR"), CitaController.asignarConsultorio);
router.delete("/:id/consultorio", requirePermission("CONSULTORIO_GESTIONAR"), CitaController.liberarConsultorio);

export default router;
