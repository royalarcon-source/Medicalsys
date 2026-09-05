import { Router } from "express";
import { ConsentimientoController } from "../controllers/consentimiento.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();
const controller = new ConsentimientoController();

// HU-26: Médico emite consentimiento
router.post("/", authenticateJWT, controller.emitirConsentimiento);

// HU-27: Paciente firma consentimiento
router.patch("/:id/firmar", authenticateJWT, controller.firmarConsentimiento);

// Consultar consentimientos por paciente
router.get("/paciente/:idPaciente", authenticateJWT, controller.obtenerPorPaciente);

export default router;
