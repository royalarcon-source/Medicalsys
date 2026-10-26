import { Router } from "express";
import { HistoriaClinicaController } from "../controllers/HistoriaClinicaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("HISTORIA_CLINICA_VER"), HistoriaClinicaController.buscarPorCI);
router.post("/", requirePermission("HISTORIA_CLINICA_CREAR"), HistoriaClinicaController.abrirManual);

export default router;
