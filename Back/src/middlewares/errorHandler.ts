// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { AuditLogService } from "../services/AuditLogService";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  // error inesperado — no exponer detalles internos (CA-11 de HU-11, CA-14 de HU-12)
  // HU-39: registrar en auditoría sin bloquear la respuesta
  void AuditLogService.registrar({
    accion: "ERROR_INTERNO",
    ip: _req.socket?.remoteAddress ?? null,
    userAgent: _req.headers?.["user-agent"] ?? null,
    resultado: "ERROR",
    detalle: { mensaje: error.message, path: _req.path, method: _req.method },
  });

  return res.status(500).json({ error: "Ocurrió un error interno" });
}