import { Router } from "express";
import { FacturaController } from "../controllers/FacturaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// Emitir nueva factura digital con integración SIN (AR-32 / HU-31)
router.post("/", requirePermission("FACTURA_CREAR"), FacturaController.emitir);

// Listar facturas con filtros avanzados (HU-30)
router.get("/", requirePermission("FACTURA_VER"), FacturaController.listar);

// Pendientes de facturación por paciente
router.get("/pacientes/:idPaciente/pendientes", requirePermission("FACTURA_CREAR"), FacturaController.obtenerPendientesPorPaciente);

// Consultar factura por ID con metadatos fiscales del SIN (HU-30 / HU-31)
router.get("/:id", requirePermission("FACTURA_VER"), FacturaController.obtenerPorId);

// Anular factura comunicando al SIN (HU-31)
router.post("/:id/anular", requirePermission("FACTURA_GESTIONAR"), FacturaController.anular);

export default router;
