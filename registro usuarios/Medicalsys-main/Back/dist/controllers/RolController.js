"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolController = void 0;
const RolService_1 = require("../services/RolService");
const AppError_1 = require("../utils/AppError");
exports.RolController = {
    async listar(req, res, next) {
        try {
            const roles = await RolService_1.RolService.listar();
            return res.json({ roles });
        }
        catch (error) {
            next(error);
        }
    },
    async obtenerPorId(req, res, next) {
        try {
            const idRol = Number(req.params.id);
            if (!Number.isInteger(idRol) || idRol <= 0) {
                throw new AppError_1.AppError("El id del rol debe ser un número entero positivo", 400);
            }
            const rol = await RolService_1.RolService.buscarPorId(idRol);
            return res.json({ rol });
        }
        catch (error) {
            next(error);
        }
    },
    async crear(req, res, next) {
        try {
            const datos = {
                nombre: req.body.nombre,
                descripcion: req.body.descripcion,
            };
            if (typeof datos.nombre !== "string" || !datos.nombre.trim()) {
                throw new AppError_1.AppError("El nombre del rol es obligatorio", 400);
            }
            const rol = await RolService_1.RolService.crear(datos);
            return res.status(201).json({
                mensaje: "Rol creado correctamente",
                rol,
            });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=RolController.js.map