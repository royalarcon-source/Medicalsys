import { Request, Response, NextFunction } from "express";
import { AnuncioService } from "../services/AnuncioService";
import { CrearAnuncioDTO, CambiarEstadoAnuncioDTO } from "../dtos/anuncio.dto";
import { hasPermission } from "../permissions/rolePermissions";
import { AppError } from "../utils/AppError";

function puedeVerTodos(req: Request): boolean {
  return !!req.authUser && hasPermission(req.authUser.rol, "ANUNCIO_GESTIONAR") && req.query.todos === "true";
}

export const AnuncioController = {
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CrearAnuncioDTO = req.body;
      const anuncio = await AnuncioService.crear(dto);
      return res.status(201).json({ mensaje: "Anuncio creado exitosamente", anuncio });
    } catch (error) {
      next(error);
    }
  },

  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const idAnuncio = Number(req.params.id);
      if (!Number.isInteger(idAnuncio) || idAnuncio <= 0) {
        throw new AppError("ID de anuncio inválido", 400);
      }

      const dto: CambiarEstadoAnuncioDTO = req.body;
      const anuncio = await AnuncioService.cambiarEstado(idAnuncio, dto);
      const verbo = dto.estado === "PUBLICADO" ? "publicado" : dto.estado === "ARCHIVADO" ? "archivado" : "actualizado";
      return res.status(200).json({ mensaje: `Anuncio ${verbo} exitosamente`, anuncio });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const filtros = {
        estado: req.query.estado as string | undefined,
        todos: puedeVerTodos(req),
      };

      const anuncios = await AnuncioService.listar(filtros);
      return res.status(200).json({ anuncios });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const idAnuncio = Number(req.params.id);
      if (!Number.isInteger(idAnuncio) || idAnuncio <= 0) {
        throw new AppError("ID de anuncio inválido", 400);
      }

      const anuncio = await AnuncioService.obtenerPorId(idAnuncio, puedeVerTodos(req));
      return res.status(200).json({ anuncio });
    } catch (error) {
      next(error);
    }
  },
};
