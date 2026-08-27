"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RolController_1 = require("../controllers/RolController");
const requirePermission_1 = require("../middlewares/requirePermission");
const router = (0, express_1.Router)();
router.get("/", RolController_1.RolController.listar);
router.get("/:id", RolController_1.RolController.obtenerPorId);
router.post("/", (0, requirePermission_1.requirePermission)("ROL_CREAR"), RolController_1.RolController.crear);
exports.default = router;
//# sourceMappingURL=rol.routes.js.map