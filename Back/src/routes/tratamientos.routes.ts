import { Router } from "express";
import { TratamientoController } from "../controllers/TratamientoController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("TRATAMIENTO_VER"), TratamientoController.listar);
router.get("/:id", requirePermission("TRATAMIENTO_VER"), TratamientoController.obtenerPorId);
router.post("/", requirePermission("TRATAMIENTO_REGISTRAR"), TratamientoController.registrar);

export default router;
