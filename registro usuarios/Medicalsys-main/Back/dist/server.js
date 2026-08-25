"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const medico_routes_1 = __importDefault(require("./routes/medico.routes"));
const especialidad_routes_1 = __importDefault(require("./routes/especialidad.routes"));
const paciente_routes_1 = __importDefault(require("./routes/paciente.routes"));
const rol_routes_1 = __importDefault(require("./routes/rol.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
app.use("/api/medicos", medico_routes_1.default);
app.use("/api/especialidades", especialidad_routes_1.default);
app.use("/api/pacientes", paciente_routes_1.default);
app.use("/api/roles", rol_routes_1.default);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
database_1.AppDataSource.initialize()
    .then(() => {
    console.log("Conexión a PostgreSQL establecida");
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("Error al conectar con la base de datos:", error);
});
//# sourceMappingURL=server.js.map