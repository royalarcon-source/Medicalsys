"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacienteRepository = void 0;
const database_1 = require("../config/database");
const Paciente_entity_1 = require("../entities/Paciente.entity");
exports.PacienteRepository = database_1.AppDataSource.getRepository(Paciente_entity_1.Paciente).extend({
    async buscarPorUsuario(idUsuario) {
        return this.findOne({
            where: { usuario: { idUsuario } },
            relations: { usuario: true },
        });
    },
    async buscarPorDocumento(documentoIdentidad) {
        return this.findOne({ where: { documentoIdentidad } });
    },
    async crear(datos) {
        const paciente = this.create({
            usuario: { idUsuario: datos.idUsuario },
            documentoIdentidad: datos.documentoIdentidad,
            fechaNacimiento: datos.fechaNacimiento,
            sexo: datos.sexo ?? null,
            direccion: datos.direccion ?? null,
            contactoEmergencia: datos.contactoEmergencia ?? null,
            telefonoEmergencia: datos.telefonoEmergencia ?? null,
        });
        return this.save(paciente);
    },
});
//# sourceMappingURL=PacienteRepository.js.map