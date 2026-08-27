// src/routes/paciente.routes.ts
import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// T4_HU10: Búsqueda paginada de pacientes
router.get("/", requirePermission("PACIENTE_CONSULTAR"), PacienteController.buscar);
router.get("/buscar", requirePermission("PACIENTE_CONSULTAR"), PacienteController.buscar);

// Registro de un nuevo paciente
router.post("/", requirePermission("PACIENTE_CREAR"), PacienteController.registrar);
router.post("/registrar", requirePermission("PACIENTE_CREAR"), PacienteController.registrar);

// T5_HU10: Detalle del perfil del paciente
router.get("/:id", requirePermission("PACIENTE_CONSULTAR"), PacienteController.obtenerDetalle);

export default router;
