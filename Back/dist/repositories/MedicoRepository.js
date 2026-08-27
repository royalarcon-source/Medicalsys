"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicoRepository = void 0;
// src/repositories/MedicoRepository.ts
const database_1 = require("../config/database");
const Medico_entity_1 = require("../entities/Medico.entity");
const AppError_1 = require("../utils/AppError");
exports.MedicoRepository = database_1.AppDataSource.getRepository(Medico_entity_1.Medico).extend({
    async buscarPorUsuario(idUsuario) {
        return this.findOne({
            where: { usuario: { idUsuario } },
            relations: { usuario: true },
        });
    },
    async buscarPorNumeroColegiatura(numeroColegiatura) {
        return this.findOne({ where: { numeroColegiatura } });
    },
    async buscarPorId(idMedico) {
        return this.findOne({
            where: { idMedico },
            relations: { usuario: true, especialidades: true },
        });
    },
    async crear(datos) {
        const medico = this.create({
            usuario: { idUsuario: datos.usuarioId },
            numeroColegiatura: datos.numeroColegiatura,
        });
        return this.save(medico);
    },
    async asignarEspecialidades(idMedico, especialidades) {
        const medico = await this.buscarPorId(idMedico);
        if (!medico)
            throw new AppError_1.AppError("Médico no encontrado", 404);
        medico.especialidades = especialidades;
        return this.save(medico);
    },
});
//# sourceMappingURL=MedicoRepository.js.map