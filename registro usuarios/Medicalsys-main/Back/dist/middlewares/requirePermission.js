"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
function requirePermission(_permiso) {
    return (req, res, next) => {
        // ⚠️ TEMPORAL: deja pasar todo, sin validar rol/permiso real.
        // Reemplazar por la implementación de HU-08 en cuanto esté disponible.
        next();
    };
}
//# sourceMappingURL=requirePermission.js.map