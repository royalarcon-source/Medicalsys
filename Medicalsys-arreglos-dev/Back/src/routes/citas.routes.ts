import { Router } from "express";
import { CitaController } from "../controllers/CitaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("CITA_CONSULTAR"), CitaController.listar);
router.get("/slots", requirePermission("CITA_RESERVAR"), CitaController.obtenerSlots);
router.post("/", requirePermission("CITA_RESERVAR"), CitaController.reservar);
router.patch("/:id/reprogramar", requirePermission("CITA_GESTIONAR"), CitaController.reprogramar);
router.put("/:id/reprogramar", requirePermission("CITA_GESTIONAR"), CitaController.reprogramar);
router.patch("/:id/cancelar", requirePermission("CITA_GESTIONAR"), CitaController.cancelar);
router.delete("/:id", requirePermission("CITA_GESTIONAR"), CitaController.cancelar);
router.patch("/:id/asignar-consultorio", requirePermission("CONSULTORIO_GESTIONAR"), CitaController.asignarConsultorio);
router.delete("/:id/consultorio", requirePermission("CONSULTORIO_GESTIONAR"), CitaController.liberarConsultorio);

export default router;
