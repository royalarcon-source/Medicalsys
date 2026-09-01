// src/scripts/migrate_hu18.ts
import { AppDataSource } from "../config/database";

async function run() {
  await AppDataSource.initialize();
  console.log("Adding HU-18 columns to table consulta...");

  await AppDataSource.query(`
    ALTER TABLE consulta
    ADD COLUMN IF NOT EXISTS tipo_ingreso VARCHAR(30),
    ADD COLUMN IF NOT EXISTS numero_turno INT,
    ADD COLUMN IF NOT EXISTS estado_consulta VARCHAR(20) DEFAULT 'EN_ESPERA';
  `);

  console.log("Migration completed successfully!");
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
