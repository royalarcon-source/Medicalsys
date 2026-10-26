import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { AuditLogService } from "../services/AuditLogService";

const authService = new AuthService();

function clientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? null;
}

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);

      // HU-37: auditoría de registro de usuario
      void AuditLogService.registrar({
        idUsuario: result.id_usuario,
        rol: result.rol,
        accion: "USUARIO_REGISTRAR",
        entidad: "Usuario",
        idEntidad: result.id_usuario,
        ip: clientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
        resultado: "EXITO",
      });

      res.status(201).json({
        message: "Usuario registrado exitosamente.",
        usuario: result,
      });
    } catch (error: any) {
      const status = error.status || 500;
      const message = status === 500 ? "Error interno del servidor." : error.message;

      // HU-37: auditoría de intento de registro fallido
      void AuditLogService.registrar({
        accion: "USUARIO_REGISTRAR",
        ip: clientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
        resultado: status >= 500 ? "ERROR" : "ACCESO_DENEGADO",
        detalle: { mensaje: message, email: req.body?.email },
      });

      res.status(status).json({ message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);

      // HU-37: auditoría de login exitoso
      void AuditLogService.registrar({
        idUsuario: result.usuario.id_usuario,
        rol: result.usuario.rol,
        accion: "LOGIN_OK",
        entidad: "Usuario",
        idEntidad: result.usuario.id_usuario,
        ip: clientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
        resultado: "EXITO",
      });

      res.status(200).json({
        message: "Inicio de sesión exitoso.",
        ...result,
      });
    } catch (error: any) {
      const status = error.status || 500;
      const message = status === 500 ? "Error interno del servidor." : error.message;

      // HU-37: auditoría de login fallido
      void AuditLogService.registrar({
        accion: "LOGIN_FAIL",
        ip: clientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
        resultado: status >= 500 ? "ERROR" : "ACCESO_DENEGADO",
        detalle: { mensaje: message, email: req.body?.email },
      });

      res.status(status).json({ message });
    }
  }
}

