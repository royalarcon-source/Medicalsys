import { Router } from "express";
import { CitaController } from "../controllers/CitaController";
import { authenticateJWT, requireRoles } from "../middlewares/auth.middleware";
import { RolNombre } from "../entities/Rol.entity";

const router = Router();
const controller = new CitaController();

router.use(authenticateJWT);

// GET /api/citas (Todos los roles autenticados)
router.get("/", (req, res) => controller.listar(req, res));

// POST /api/citas (HU-15: Paciente, Recepcionista, Admin)
router.post(
  "/",
  requireRoles(RolNombre.PACIENTE, RolNombre.RECEPCIONISTA, RolNombre.ADMINISTRADOR),
  (req, res) => controller.reservar(req, res)
);

// PUT /api/citas/:id/reprogramar (HU-16)
router.put(
  "/:id/reprogramar",
  requireRoles(RolNombre.PACIENTE, RolNombre.RECEPCIONISTA, RolNombre.ADMINISTRADOR),
  (req, res) => controller.reprogramar(req, res)
);

// PATCH /api/citas/:id/cancelar (HU-16)
router.patch(
  "/:id/cancelar",
  requireRoles(RolNombre.PACIENTE, RolNombre.RECEPCIONISTA, RolNombre.ADMINISTRADOR),
  (req, res) => controller.cancelar(req, res)
);

export default router;
