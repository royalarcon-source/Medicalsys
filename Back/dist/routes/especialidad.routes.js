"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/especialidad.routes.ts
const express_1 = require("express");
const EspecialidadController_1 = require("../controllers/EspecialidadController");
const requirePermission_1 = require("../middlewares/requirePermission");
const router = (0, express_1.Router)();
router.get("/", EspecialidadController_1.EspecialidadController.listar); // consulta abierta a cualquier autenticado (CA-01 HU-12)
router.post("/", (0, requirePermission_1.requirePermission)("ESPECIALIDAD_GESTIONAR"), EspecialidadController_1.EspecialidadController.crear);
router.put("/:id", (0, requirePermission_1.requirePermission)("ESPECIALIDAD_GESTIONAR"), EspecialidadController_1.EspecialidadController.actualizar);
router.put("/medicos/:id/especialidades", (0, requirePermission_1.requirePermission)("ESPECIALIDAD_GESTIONAR"), EspecialidadController_1.EspecialidadController.asignarAMedico);
exports.default = router;
//# sourceMappingURL=especialidad.routes.js.map