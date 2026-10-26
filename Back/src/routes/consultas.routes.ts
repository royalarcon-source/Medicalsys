import { Router } from "express";
import { ConsultaController } from "../controllers/ConsultaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("CONSULTA_GESTIONAR"), ConsultaController.listar);
router.get("/:id", requirePermission("CONSULTA_GESTIONAR"), ConsultaController.obtenerPorId);
router.post("/", requirePermission("CONSULTA_REGISTRAR"), ConsultaController.registrarSinCita);
router.post("/sin-cita", requirePermission("CONSULTA_REGISTRAR"), ConsultaController.registrarSinCita);
router.patch("/:id/completar", requirePermission("CONSULTA_GESTIONAR"), ConsultaController.completar);
router.patch("/:id/estado", requirePermission("CONSULTA_GESTIONAR"), ConsultaController.actualizarEstado);

export default router;
