import { Router } from "express";
import { CampanaController } from "../controllers/CampanaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// Listar campañas (zona de anuncios, HU-32)
router.get("/", requirePermission("CAMPANA_VER"), CampanaController.listar);

// Consultar campaña por ID (HU-32)
router.get("/:id", requirePermission("CAMPANA_VER"), CampanaController.obtenerPorId);

// Crear campaña (HU-32)
router.post("/", requirePermission("CAMPANA_GESTIONAR"), CampanaController.crear);

// Cambiar estado de campaña según la máquina de estados (HU-32)
router.patch("/:id/estado", requirePermission("CAMPANA_GESTIONAR"), CampanaController.cambiarEstado);

export default router;
