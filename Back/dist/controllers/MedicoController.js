"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicoController = void 0;
const MedicoService_1 = require("../services/MedicoService");
exports.MedicoController = {
    async registrar(req, res, next) {
        try {
            const datos = {
                idUsuario: req.body.idUsuario,
                numeroColegiatura: req.body.numeroColegiatura,
            };
            if (!datos.idUsuario || !datos.numeroColegiatura) {
                return res.status(400).json({
                    error: "idUsuario y numeroColegiatura son obligatorios",
                });
            }
            const medico = await MedicoService_1.MedicoService.registrar(datos);
            return res.status(201).json({
                mensaje: "Médico registrado correctamente",
                medico: {
                    idMedico: medico.idMedico,
                    numeroColegiatura: medico.numeroColegiatura,
                    activo: medico.activo,
                },
            });
        }
        catch (error) {
            next(error); // lo captura el errorHandler global
        }
    },
    async obtenerPorId(req, res, next) {
        try {
            const id = Number(req.params.id);
            const medico = await MedicoService_1.MedicoService.buscarPorId(id);
            return res.json({ medico });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=MedicoController.js.map