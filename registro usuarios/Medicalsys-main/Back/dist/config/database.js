"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
// process.env siempre es `string | undefined`; con `strict` hay que resolver el undefined aquí
function env(key, fallback) {
    const value = process.env[key] ?? fallback;
    if (value === undefined) {
        throw new Error(`Falta la variable de entorno ${key} (revisa tu archivo .env)`);
    }
    return value;
}
// Resuelve rutas desde este archivo, así funciona igual con ts-node (.ts) que compilado (.js)
const extension = path_1.default.extname(__filename); // ".ts" o ".js"
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: env("DB_HOST", "localhost"),
    port: Number(env("DB_PORT", "5432")),
    username: env("DB_USERNAME"),
    password: env("DB_PASSWORD", ""),
    database: env("DB_DATABASE"),
    synchronize: false, // NUNCA true en un proyecto con migraciones — sincronizaría el schema automáticamente y te pisa las migraciones
    logging: process.env.NODE_ENV === "development",
    ssl: {
        rejectUnauthorized: false,
    },
    entities: [path_1.default.join(__dirname, "..", "entities", `*.entity${extension}`)],
    migrations: [path_1.default.join(__dirname, "..", "migrations", `*${extension}`)],
});
//# sourceMappingURL=database.js.map