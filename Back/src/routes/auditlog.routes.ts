import { Router } from "express";
import { AuditLogController } from "../controllers/AuditLogController";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

/**
 * HU-39: Consultar registros de auditoría.
 * Solo ADMINISTRADOR tiene el permiso AUDITORIA_VER.
 *
 * Query params opcionales:
 *   idUsuario, accion, resultado, entidad, desde, hasta, page, limit
 */
router.get("/", requirePermission("AUDITORIA_VER"), AuditLogController.listar);

export default router;
