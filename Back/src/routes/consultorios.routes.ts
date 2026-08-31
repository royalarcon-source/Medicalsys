// src/routes/consultorios.routes.ts
import { Router } from "express";
import { ConsultorioController } from "../controllers/ConsultorioController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// HU-17: Listar consultorios (con o sin rango para disponibilidad)
router.get("/", requirePermission("CONSULTORIO_VER"), ConsultorioController.listar);
router.get("/disponibles", requirePermission("CONSULTORIO_VER"), ConsultorioController.listar);

// HU-17: Asignar consultorio a cita
router.patch("/asignar-cita/:id", requirePermission("CONSULTORIO_GESTIONAR"), ConsultorioController.asignarACita);
router.post("/asignar-cita", requirePermission("CONSULTORIO_GESTIONAR"), ConsultorioController.asignarACita);

// HU-17: Liberar consultorio de cita
router.delete("/liberar-cita/:id", requirePermission("CONSULTORIO_GESTIONAR"), ConsultorioController.liberarDeCita);

export default router;
