// src/routes/disponibilidad.routes.ts
import { Router } from "express";
import { HorarioDisponibilidadController } from "../controllers/HorarioDisponibilidadController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// HU-13: Registrar disponibilidad médica
router.post("/", requirePermission("DISPONIBILIDAD_GESTIONAR"), HorarioDisponibilidadController.registrar);
router.patch("/:id", requirePermission("DISPONIBILIDAD_GESTIONAR"), HorarioDisponibilidadController.actualizar);
router.delete("/:id", requirePermission("DISPONIBILIDAD_GESTIONAR"), HorarioDisponibilidadController.desactivar);

// HU-14: Consultar disponibilidad
router.get("/", requirePermission("DISPONIBILIDAD_VER"), HorarioDisponibilidadController.buscar);

export default router;
