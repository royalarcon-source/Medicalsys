"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolRepository = void 0;
const database_1 = require("../config/database");
const Rol_entity_1 = require("../entities/Rol.entity");
exports.RolRepository = database_1.AppDataSource.getRepository(Rol_entity_1.Rol).extend({
    async buscarPorNombre(nombre) {
        return this.findOne({ where: { nombre } });
    },
    async listarTodos() {
        return this.find({ order: { nombre: "ASC" } });
    },
});
//# sourceMappingURL=RolRepository.js.map