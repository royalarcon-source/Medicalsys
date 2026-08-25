"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadRepository = void 0;
// src/repositories/EspecialidadRepository.ts
const database_1 = require("../config/database");
const Especialidad_entity_1 = require("../entities/Especialidad.entity");
exports.EspecialidadRepository = database_1.AppDataSource.getRepository(Especialidad_entity_1.Especialidad).extend({
    async buscarPorNombre(nombre) {
        return this.findOne({ where: { nombre } });
    },
    async listarTodas() {
        return this.find({ order: { nombre: "ASC" } });
    },
    async buscarPorIds(ids) {
        return this.createQueryBuilder("especialidad")
            .whereInIds(ids)
            .getMany();
    },
});
//# sourceMappingURL=EspecialidadRepository.js.map