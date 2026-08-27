import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.post("/", requirePermission("PACIENTE_CREAR"), PacienteController.registrar);
router.post("/registrar", requirePermission("PACIENTE_CREAR"), PacienteController.registrar);

export default router;