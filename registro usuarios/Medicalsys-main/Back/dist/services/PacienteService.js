"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacienteService = void 0;
const database_1 = require("../config/database");
const Usuario_entity_1 = require("../entities/Usuario.entity");
const PacienteRepository_1 = require("../repositories/PacienteRepository");
const AppError_1 = require("../utils/AppError");
const NOMBRE_ROL_PACIENTE = "PACIENTE";
exports.PacienteService = {
    async registrar(datos) {
        const usuario = await database_1.AppDataSource.getRepository(Usuario_entity_1.Usuario).findOne({
            where: { idUsuario: datos.idUsuario },
            relations: { rol: true },
        });
        if (!usuario) {
            throw new AppError_1.AppError("El usuario indicado no existe", 404);
        }
        if (usuario.rol.nombre !== NOMBRE_ROL_PACIENTE) {
            throw new AppError_1.AppError("El usuario no tiene rol PACIENTE", 400);
        }
        if (await PacienteRepository_1.PacienteRepository.buscarPorUsuario(datos.idUsuario)) {
            throw new AppError_1.AppError("Este usuario ya tiene un perfil de paciente registrado", 409);
        }
        if (await PacienteRepository_1.PacienteRepository.buscarPorDocumento(datos.documentoIdentidad)) {
            throw new AppError_1.AppError("Ya existe un paciente con ese documento de identidad", 409);
        }
        return PacienteRepository_1.PacienteRepository.crear(datos);
    },
};
//# sourceMappingURL=PacienteService.js.map