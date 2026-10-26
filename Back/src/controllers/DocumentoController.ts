import { Request, Response, NextFunction } from "express";
import { DocumentoService } from "../services/DocumentoService";

const documentoService = new DocumentoService();

export const DocumentoController = {
  async subir(req: Request, res: Response, next: NextFunction) {
    try {
      const idConsulta = Number(req.body.idConsulta);
      const documento = await documentoService.subir(
        idConsulta,
        req.body.tipo,
        req.file as Express.Multer.File,
        req.authUser!,
      );
      return res.status(201).json({ mensaje: "Documento subido exitosamente.", documento });
    } catch (error) {
      return next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const idConsulta = req.query.idConsulta === undefined ? undefined : Number(req.query.idConsulta);
      const documentos = await documentoService.listar(idConsulta, req.authUser!);
      return res.status(200).json({ documentos });
    } catch (error) {
      return next(error);
    }
  },
};
