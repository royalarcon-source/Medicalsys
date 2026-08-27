"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadController = void 0;
const EspecialidadService_1 = require("../services/EspecialidadService");
exports.EspecialidadController = {
    async crear(req, res, next) {
        try {
            const { nombre, descripcion } = req.body;
            if (!nombre) {
                return res.status(400).json({ error: "El nombre es obligatorio" });
            }
            const especialidad = await EspecialidadService_1.EspecialidadService.crear({ nombre, descripcion });
            return res.status(201).json({ mensaje: "Especialidad creada", especialidad });
        }
        catch (error) {
            next(error);
        }
    },
    async listar(req, res, next) {
        try {
            const especialidades = await EspecialidadService_1.EspecialidadService.listar();
            return res.json({ especialidades });
        }
        catch (error) {
            next(error);
        }
    },
    async actualizar(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { nombre, descripcion } = req.body;
            if (!nombre) {
                return res.status(400).json({ error: "El nombre es obligatorio" });
            }
            const especialidad = await EspecialidadService_1.EspecialidadService.actualizar(id, { nombre, descripcion });
            return res.json({ mensaje: "Especialidad actualizada", especialidad });
        }
        catch (error) {
            next(error);
        }
    },
    async asignarAMedico(req, res, next) {
        try {
            const idMedico = Number(req.params.id);
            const { idEspecialidades } = req.body;
            if (!Array.isArray(idEspecialidades)) {
                return res.status(400).json({ error: "idEspecialidades debe ser un arreglo" });
            }
            await EspecialidadService_1.EspecialidadService.asignarAMedico(idMedico, { idEspecialidades });
            return res.json({ mensaje: "Especialidades asignadas correctamente" });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=EspecialidadController.js.map