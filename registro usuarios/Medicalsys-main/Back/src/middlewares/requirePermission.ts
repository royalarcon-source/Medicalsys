// src/middlewares/requirePermission.ts (TEMPORAL — reemplazar cuando HU-08 esté lista)
import { Request, Response, NextFunction } from "express";

export function requirePermission(_permiso: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // ⚠️ TEMPORAL: deja pasar todo, sin validar rol/permiso real.
    // Reemplazar por la implementación de HU-08 en cuanto esté disponible.
    next();
  };
}