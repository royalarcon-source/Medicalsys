// src/routes/especialidad.routes.ts
import { Router } from "express";
import { EspecialidadController } from "../controllers/EspecialidadController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", EspecialidadController.listar); // consulta abierta a cualquier autenticado (CA-01 HU-12)
router.post("/", requirePermission("ESPECIALIDAD_GESTIONAR"), EspecialidadController.crear);
router.put("/:id", requirePermission("ESPECIALIDAD_GESTIONAR"), EspecialidadController.actualizar);
router.put(
  "/medicos/:id/especialidades",
  requirePermission("ESPECIALIDAD_GESTIONAR"),
  EspecialidadController.asignarAMedico
);

export default router;