import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";

const ROLES_CONSULTA_PACIENTES = new Set(["ADMINISTRADOR", "RECEPCIONISTA", "MEDICO"]);

export function requirePermission(permiso: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Debe iniciar sesión para acceder a este recurso", 401);
      }

      const token = authHeader.replace("Bearer ", "").trim();
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new AppError("Configuración de autenticación incompleta", 500);
      }

      const payload = jwt.verify(token, jwtSecret) as any;

      if (!payload || !payload.idUsuario) {
        throw new AppError("Token inválido", 401);
      }

      const rolNombre = typeof payload.rol === "string" ? payload.rol : payload.rol?.nombre;

      if (!rolNombre) {
        throw new AppError("Usuario sin rol válido", 401);
      }

      const permisos: string[] = Array.isArray(payload.permisos) ? payload.permisos : [];
      const tienePermiso = permisos.includes(permiso);

      if (!ROLES_CONSULTA_PACIENTES.has(rolNombre) || !tienePermiso) {
        throw new AppError("No tienes permisos para realizar esta acción", 403);
      }

      (req as any).user = {
        ...payload,
        idUsuario: payload.idUsuario,
        rol: { nombre: rolNombre },
      };

      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError("Token expirado", 401));
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError("Token inválido", 401));
      }

      return next(error);
    }
  };
}