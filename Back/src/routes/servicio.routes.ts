import { Router } from "express";
import { ServicioController } from "../controllers/ServicioController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("SERVICIO_LISTAR"), ServicioController.listar);
router.post("/", requirePermission("SERVICIO_GESTIONAR"), ServicioController.crear);

export default router;

