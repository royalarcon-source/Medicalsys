import { Router } from "express";
import { DiagnosticoController } from "../controllers/DiagnosticoController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("DIAGNOSTICO_VER"), DiagnosticoController.listar);
router.get("/:id", requirePermission("DIAGNOSTICO_VER"), DiagnosticoController.obtenerPorId);
router.post("/", requirePermission("DIAGNOSTICO_REGISTRAR"), DiagnosticoController.registrar);

export default router;
