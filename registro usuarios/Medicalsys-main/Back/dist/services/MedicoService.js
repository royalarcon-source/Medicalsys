"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicoService = void 0;
// src/services/MedicoService.ts
const MedicoRepository_1 = require("../repositories/MedicoRepository");
const database_1 = require("../config/database");
const Usuario_entity_1 = require("../entities/Usuario.entity");
const AppError_1 = require("../utils/AppError");
const NOMBRE_ROL_MEDICO = "MEDICO";
exports.MedicoService = {
    async registrar(datos) {
        // CA-08: usuario debe existir
        const usuarioRepo = database_1.AppDataSource.getRepository(Usuario_entity_1.Usuario);
        const usuario = await usuarioRepo.findOne({
            where: { idUsuario: datos.idUsuario },
            relations: { rol: true },
        });
        if (!usuario) {
            throw new AppError_1.AppError("El usuario indicado no existe", 404);
        }
        // CA-02: el usuario debe tener rol MEDICO
        if (usuario.rol.nombre !== NOMBRE_ROL_MEDICO) {
            throw new AppError_1.AppError("El usuario no tiene rol MEDICO. Asigná el rol primero (HU-07).", 400);
        }
        // CA-03: un usuario no puede tener más de un perfil de médico
        const medicoExistente = await MedicoRepository_1.MedicoRepository.buscarPorUsuario(datos.idUsuario);
        if (medicoExistente) {
            throw new AppError_1.AppError("Este usuario ya tiene un perfil de médico registrado", 409);
        }
        // CA-05: numero_colegiatura único
        const colegiaturaExistente = await MedicoRepository_1.MedicoRepository.buscarPorNumeroColegiatura(datos.numeroColegiatura);
        if (colegiaturaExistente) {
            throw new AppError_1.AppError("Ya existe un médico con ese número de colegiatura", 409);
        }
        return MedicoRepository_1.MedicoRepository.crear({
            usuarioId: datos.idUsuario,
            numeroColegiatura: datos.numeroColegiatura,
        });
    },
    async buscarPorId(idMedico) {
        const medico = await MedicoRepository_1.MedicoRepository.buscarPorId(idMedico);
        if (!medico) {
            throw new AppError_1.AppError("Médico no encontrado", 404);
        }
        return medico;
    },
    async buscarPorNumeroColegiatura(numeroColegiatura) {
        const medico = await MedicoRepository_1.MedicoRepository.buscarPorNumeroColegiatura(numeroColegiatura);
        if (!medico) {
            throw new AppError_1.AppError("No existe un médico con ese número de colegiatura", 404);
        }
        return medico;
    },
};
//# sourceMappingURL=MedicoService.js.map