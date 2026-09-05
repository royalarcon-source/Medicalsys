import { Router } from "express";
import { DocumentoController } from "../controllers/DocumentoController";
import { recibirDocumento } from "../middlewares/documentoUpload";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", requirePermission("DOCUMENTO_VER"), DocumentoController.listar);
router.post(
  "/",
  requirePermission("DOCUMENTO_SUBIR"),
  recibirDocumento,
  DocumentoController.subir,
);

export default router;
