import { Router } from "express";
import { AtencionServicioController } from "../controllers/AtencionServicioController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// Registrar servicios asociados a una atención médica (AR-31)
router.post("/", requirePermission("ATENCION_SERVICIO_REGISTRAR"), AtencionServicioController.registrar);

// Modificar servicio de una atención (cantidad, precio, observaciones) antes de facturar
router.put("/:id", requirePermission("ATENCION_SERVICIO_MODIFICAR"), AtencionServicioController.actualizar);

// Eliminar servicio de una atención antes de facturar
router.delete("/:id", requirePermission("ATENCION_SERVICIO_ELIMINAR"), AtencionServicioController.eliminar);

// Listar servicios de una consulta específica
router.get("/consulta/:idConsulta", requirePermission("ATENCION_SERVICIO_VER"), AtencionServicioController.listarPorConsulta);

// Listar servicios de un paciente (opcionalmente filtrado por estado=PENDIENTE|FACTURADO)
router.get("/paciente/:idPaciente", requirePermission("ATENCION_SERVICIO_VER"), AtencionServicioController.listarPorPaciente);

export default router;

