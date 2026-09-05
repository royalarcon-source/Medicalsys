import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

const tiposPermitidos = new Set(["application/pdf", "image/png", "image/jpeg"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!tiposPermitidos.has(file.mimetype)) {
      callback(new AppError("Tipo de archivo no permitido. Usa PDF, PNG o JPEG.", 400));
      return;
    }
    callback(null, true);
  },
});

export function recibirDocumento(req: Request, res: Response, next: NextFunction): void {
  upload.single("archivo")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new AppError("El archivo no puede superar 10 MB.", 400));
        return;
      }
      next(new AppError("El archivo enviado no es válido.", 400));
      return;
    }
    next(error);
  });
}
