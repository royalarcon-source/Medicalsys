import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RolNombre } from "../entities/Rol.entity";

export interface TokenPayload {
  id_usuario: number;
  email: string;
  rol: RolNombre;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
  }
  return secret;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Acceso denegado. Se requiere un token válido." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
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

    if (!allowedRoles.includes(req.user.rol)) {
      res.status(403).json({ message: "Acceso denegado: permisos insuficientes para esta operación." });
      return;
    }

    next();
  };
};
