import { Router } from "express";
import { PromocionController } from "../controllers/PromocionController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// Listar promociones (zona de anuncios, HU-33)
router.get("/", requirePermission("PROMOCION_VER"), PromocionController.listar);

// Consultar promoción por ID (HU-33)
router.get("/:id", requirePermission("PROMOCION_VER"), PromocionController.obtenerPorId);

// Crear promoción asociada a una campaña existente (HU-33)
router.post("/", requirePermission("PROMOCION_GESTIONAR"), PromocionController.crear);

// Activar/desactivar promoción (HU-33)
router.patch("/:id/estado", requirePermission("PROMOCION_GESTIONAR"), PromocionController.cambiarEstado);

export default router;
