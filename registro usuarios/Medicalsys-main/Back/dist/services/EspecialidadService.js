"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadService = void 0;
// src/services/EspecialidadService.ts
const EspecialidadRepository_1 = require("../repositories/EspecialidadRepository");
const MedicoRepository_1 = require("../repositories/MedicoRepository");
const AppError_1 = require("../utils/AppError");
exports.EspecialidadService = {
    async crear(datos) {
        // CA-03: nombre único
        const existente = await EspecialidadRepository_1.EspecialidadRepository.buscarPorNombre(datos.nombre);
        if (existente) {
            throw new AppError_1.AppError("Ya existe una especialidad con ese nombre", 409);
        }
        const especialidad = EspecialidadRepository_1.EspecialidadRepository.create({
            nombre: datos.nombre,
            descripcion: datos.descripcion ?? null,
        });
        return EspecialidadRepository_1.EspecialidadRepository.save(especialidad);
    },
    async listar() {
        return EspecialidadRepository_1.EspecialidadRepository.listarTodas();
    },
    async actualizar(id, datos) {
        const especialidad = await EspecialidadRepository_1.EspecialidadRepository.findOne({ where: { idEspecialidad: id } });
        if (!especialidad) {
            throw new AppError_1.AppError("Especialidad no encontrada", 404);
        }
        // si cambia el nombre, revalidar unicidad (CA-03)
        if (datos.nombre !== especialidad.nombre) {
            const enUso = await EspecialidadRepository_1.EspecialidadRepository.buscarPorNombre(datos.nombre);
            if (enUso) {
                throw new AppError_1.AppError("Ya existe una especialidad con ese nombre", 409);
            }
        }
        especialidad.nombre = datos.nombre;
        especialidad.descripcion = datos.descripcion ?? null;
        return EspecialidadRepository_1.EspecialidadRepository.save(especialidad);
    },
    async asignarAMedico(idMedico, datos) {
        // CA-09: médico debe existir
        const medico = await MedicoRepository_1.MedicoRepository.buscarPorId(idMedico);
        if (!medico) {
            throw new AppError_1.AppError("Médico no encontrado", 404);
        }
        // CA-08: todas las especialidades deben existir
        const especialidades = await EspecialidadRepository_1.EspecialidadRepository.buscarPorIds(datos.idEspecialidades);
        if (especialidades.length !== datos.idEspecialidades.length) {
            throw new AppError_1.AppError("Una o más especialidades indicadas no existen", 400);
        }
        await MedicoRepository_1.MedicoRepository.asignarEspecialidades(idMedico, especialidades);
    },
};
//# sourceMappingURL=EspecialidadService.js.map