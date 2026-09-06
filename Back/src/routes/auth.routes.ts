import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateJWT, requireRoles } from "../middlewares/auth.middleware";
import { RolNombre } from "../entities/Rol.entity";

const router = Router();
const authController = new AuthController();

// HU: Registrar Usuario (Exclusivo Administrador)
router.post(
  "/register",
  authenticateJWT,
  requireRoles(RolNombre.ADMINISTRADOR),
  (req, res) => authController.register(req, res)
);

// HU: Iniciar Sesión (Público)
router.post("/login", (req, res) => authController.login(req, res));

export default router;
