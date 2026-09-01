import { Router } from "express";
import { ConsultorioController } from "../controllers/ConsultorioController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("CONSULTORIO_VER"), ConsultorioController.listar);
router.post("/", requirePermission("CONSULTORIO_GESTIONAR"), ConsultorioController.crear);
router.get("/disponibles", requirePermission("CONSULTORIO_VER"), ConsultorioController.listar);
router.patch("/asignar-cita/:id", requirePermission("CONSULTORIO_GESTIONAR"), ConsultorioController.asignarACita);
router.post("/asignar-cita", requirePermission("CONSULTORIO_GESTIONAR"), ConsultorioController.asignarACita);
router.delete("/liberar-cita/:id", requirePermission("CONSULTORIO_GESTIONAR"), ConsultorioController.liberarDeCita);

export default router;
