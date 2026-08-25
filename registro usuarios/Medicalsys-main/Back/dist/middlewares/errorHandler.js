"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../utils/AppError");
function errorHandler(error, _req, res, _next) {
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    // error inesperado — no exponer detalles internos (CA-11 de HU-11, CA-14 de HU-12)
    console.error("Error no controlado:", error);
    return res.status(500).json({ error: "Ocurrió un error interno" });
}
//# sourceMappingURL=errorHandler.js.map