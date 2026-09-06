// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

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
  console.error("Error no controlado:", error);
  return res.status(500).json({ error: "Ocurrió un error interno" });
}