import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        message: "Usuario registrado exitosamente.",
        usuario: result,
      });
    } catch (error: any) {
      const status = error.status || 500;
      const message = status === 500 ? "Error interno del servidor." : error.message;
      res.status(status).json({ message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        message: "Inicio de sesión exitoso.",
        ...result,
      });
    } catch (error: any) {
      const status = error.status || 500;
      const message = status === 500 ? "Error interno del servidor." : error.message;
      res.status(status).json({ message });
    }
  }
}
