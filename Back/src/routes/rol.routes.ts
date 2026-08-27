import { Router } from "express";
import { RolController } from "../controllers/RolController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", RolController.listar);
router.get("/:id", RolController.obtenerPorId);
router.post("/", requirePermission("ROL_CREAR"), RolController.crear);

export default router;