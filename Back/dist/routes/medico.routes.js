"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/medico.routes.ts
const express_1 = require("express");
const MedicoController_1 = require("../controllers/MedicoController");
const requirePermission_1 = require("../middlewares/requirePermission");
const router = (0, express_1.Router)();
router.post("/", (0, requirePermission_1.requirePermission)("MEDICO_CREAR"), MedicoController_1.MedicoController.registrar);
router.get("/:id", MedicoController_1.MedicoController.obtenerPorId);
exports.default = router;
//# sourceMappingURL=medico.routes.js.map