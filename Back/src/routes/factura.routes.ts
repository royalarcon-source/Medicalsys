import { Router } from "express";
import { FacturaController } from "../controllers/FacturaController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// Emitir nueva factura digital (AR-32)
router.post("/", requirePermission("FACTURA_CREAR"), FacturaController.emitir);

// Listar facturas con filtros
router.get("/", requirePermission("FACTURA_VER"), FacturaController.listar);

// Pendientes de facturación por paciente
router.get("/pacientes/:idPaciente/pendientes", requirePermission("FACTURA_CREAR"), FacturaController.obtenerPendientesPorPaciente);

// Consultar factura por ID
router.get("/:id", requirePermission("FACTURA_VER"), FacturaController.obtenerPorId);

export default router;

