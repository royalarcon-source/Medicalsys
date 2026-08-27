import { Rol } from "../entities/Rol.entity";
import { CrearRolDTO } from "../dtos/rol/CrearRolDTO";
import { RolRepository } from "../repositories/RolRepository";
import { AppError } from "../utils/AppError";

export const RolService = {
  async listar(): Promise<Rol[]> {
    return RolRepository.listarTodos();
  },

  async buscarPorId(idRol: number): Promise<Rol> {
    const rol = await RolRepository.findOne({ where: { idRol } });
    if (!rol) {
      throw new AppError("Rol no encontrado", 404);
    }
    return rol;
  },

  async crear(datos: CrearRolDTO): Promise<Rol> {
    const nombre = datos.nombre.trim().toUpperCase();
    if (await RolRepository.buscarPorNombre(nombre)) {
      throw new AppError("Ya existe un rol con ese nombre", 409);
    }

    const rol = RolRepository.create({
      nombre,
      descripcion: datos.descripcion?.trim() || null,
    });
    return RolRepository.save(rol);
  },
};