import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RolNombre } from "../entities/Rol.entity";

export interface TokenPayload {
  id_usuario: string;
  email: string;
  roles: RolNombre[];
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "medicalsys_default_secret_key";

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Acceso denegado. Se requiere un token válido." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado." });
    return;
  }
};

export const requireRoles = (...allowedRoles: RolNombre[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Usuario no autenticado." });
      return;
    }

    const hasPermission = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasPermission) {
      res.status(403).json({ message: "Acceso denegado: permisos insuficientes para esta operación." });
      return;
    }

    next();
  };
};
