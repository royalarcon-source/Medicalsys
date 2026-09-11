// src/routes/medico.routes.ts
import { Router } from "express";
import { MedicoController } from "../controllers/MedicoController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.post("/", requirePermission("MEDICO_CREAR"), MedicoController.registrar);
router.get("/:id", requirePermission("MEDICO_VER"), MedicoController.obtenerPorId);

export default router;
