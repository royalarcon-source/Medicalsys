import { Router } from "express";
import { AnuncioController } from "../controllers/AnuncioController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// Listar anuncios (zona de anuncios, HU-37)
router.get("/", requirePermission("ANUNCIO_VER"), AnuncioController.listar);

// Consultar anuncio por ID (HU-37)
router.get("/:id", requirePermission("ANUNCIO_VER"), AnuncioController.obtenerPorId);

// Crear anuncio (HU-37)
router.post("/", requirePermission("ANUNCIO_GESTIONAR"), AnuncioController.crear);

// Cambiar estado de anuncio según la máquina de estados (HU-37)
router.patch("/:id/estado", requirePermission("ANUNCIO_GESTIONAR"), AnuncioController.cambiarEstado);

export default router;
