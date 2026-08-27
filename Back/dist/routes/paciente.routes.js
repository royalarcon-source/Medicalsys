"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PacienteController_1 = require("../controllers/PacienteController");
const requirePermission_1 = require("../middlewares/requirePermission");
const router = (0, express_1.Router)();
router.post("/", (0, requirePermission_1.requirePermission)("PACIENTE_CREAR"), PacienteController_1.PacienteController.registrar);
exports.default = router;
//# sourceMappingURL=paciente.routes.js.map