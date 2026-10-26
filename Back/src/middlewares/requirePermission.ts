import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Usuario } from "../entities/Usuario.entity";
import { hasPermission, Permission } from "../permissions/rolePermissions";

const jwt = require("jsonwebtoken") as {
  verify(token: string, secret: string): string | JwtPayload;
};

interface JwtPayload {
  id_usuario?: number;
  iat?: number;
  exp?: number;
}

interface AuthenticatedUser {
  idUsuario: number;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

function getUserIdFromToken(token: string): number | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
  }

  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") return null;

  const idUsuario = Number(decoded.id_usuario);
  return Number.isInteger(idUsuario) && idUsuario > 0 ? idUsuario : null;
}

export function requirePermission(permiso: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ error: "Token requerido" });
      }

      const idUsuario = getUserIdFromToken(token);
      if (!idUsuario) {
        return res.status(401).json({ error: "Token inválido" });
      }

      const usuario = await AppDataSource.getRepository(Usuario).findOne({
        where: { idUsuario },
        relations: { rol: true },
      });

      if (!usuario || !usuario.activo) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      if (!hasPermission(usuario.rol.nombre, permiso)) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      req.authUser = {
        idUsuario: usuario.idUsuario,
        rol: usuario.rol.nombre,
      };

      return next();
    } catch (error) {
      if (error instanceof Error && error.name.includes("JsonWebTokenError")) {
        return res.status(401).json({ error: "Token inválido" });
      }

      if (error instanceof Error && error.name.includes("TokenExpiredError")) {
        return res.status(401).json({ error: "Token expirado" });
      }

      return next(error);
    }
  };
}
