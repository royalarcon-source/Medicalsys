import { ServicioRepository } from "../repositories/ServicioRepository";
import { CrearServicioDTO } from "../dtos/factura.dto";
import { Servicio } from "../entities/Servicio.entity";

export class ServicioService {
  static async listar(): Promise<Servicio[]> {
    return ServicioRepository.listarActivos();
  }

  static async crear(dto: CrearServicioDTO): Promise<Servicio> {
    if (!dto.nombre || dto.nombre.trim() === "") {
      throw { status: 400, message: "El nombre del servicio es obligatorio." };
    }

    if (dto.precio === undefined || dto.precio === null || isNaN(Number(dto.precio)) || Number(dto.precio) < 0) {
      throw { status: 400, message: "El precio del servicio debe ser un número mayor o igual a 0." };
    }

    const existente = await ServicioRepository.buscarPorNombre(dto.nombre.trim());
    if (existente) {
      throw { status: 409, message: "Ya existe un servicio con ese nombre." };
    }

    const nuevo = ServicioRepository.create({
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      precio: String(Number(dto.precio).toFixed(2)),
      activo: true,
    });

    return ServicioRepository.save(nuevo);
  }
}

