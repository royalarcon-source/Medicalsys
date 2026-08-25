"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolService = void 0;
const RolRepository_1 = require("../repositories/RolRepository");
const AppError_1 = require("../utils/AppError");
exports.RolService = {
    async listar() {
        return RolRepository_1.RolRepository.listarTodos();
    },
    async buscarPorId(idRol) {
        const rol = await RolRepository_1.RolRepository.findOne({ where: { idRol } });
        if (!rol) {
            throw new AppError_1.AppError("Rol no encontrado", 404);
        }
        return rol;
    },
    async crear(datos) {
        const nombre = datos.nombre.trim().toUpperCase();
        if (await RolRepository_1.RolRepository.buscarPorNombre(nombre)) {
            throw new AppError_1.AppError("Ya existe un rol con ese nombre", 409);
        }
        const rol = RolRepository_1.RolRepository.create({
            nombre,
            descripcion: datos.descripcion?.trim() || null,
        });
        return RolRepository_1.RolRepository.save(rol);
    },
};
//# sourceMappingURL=RolService.js.map