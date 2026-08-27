// src/routes/paciente.routes.ts
import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// T4_HU10: Búsqueda paginada de pacientes
router.get("/", requirePermission("PACIENTE_CONSULTAR"), PacienteController.buscar);
router.get("/buscar", requirePermission("PACIENTE_CONSULTAR"), PacienteController.buscar);

// T5_HU10: Detalle del perfil del paciente
router.get("/:id", requirePermission("PACIENTE_CONSULTAR"), PacienteController.obtenerDetalle);

export default router;
