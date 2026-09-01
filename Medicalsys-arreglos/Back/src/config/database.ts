import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// process.env siempre es `string | undefined`; con `strict` hay que resolver el undefined aquí
function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno ${key} (revisa tu archivo .env)`);
  }
  return value;
}

// Resuelve rutas desde este archivo, así funciona igual con ts-node (.ts) que compilado (.js)
const extension = path.extname(__filename); // ".ts" o ".js"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env("DB_HOST", "localhost"),
  port: Number(env("DB_PORT", "5432")),
  username: env("DB_USERNAME", "postgres"),
  password: env("DB_PASSWORD", ""),
  database: env("DB_DATABASE", "medicalsys"),
  synchronize: process.env.DB_SYNC === "true" || (process.env.NODE_ENV === "development" && process.env.DB_SYNC !== "false"),
  logging: process.env.NODE_ENV === "development",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  entities: [path.join(__dirname, "..", "entities", `*.entity${extension}`)],
  migrations: [path.join(__dirname, "..", "migrations", `*${extension}`)],
});
