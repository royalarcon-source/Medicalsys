import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import medicoRoutes from "./routes/medico.routes";
import especialidadRoutes from "./routes/especialidad.routes";
import { errorHandler } from "./middlewares/errorHandler";

app.use("/api/medicos", medicoRoutes);
app.use("/api/especialidades", especialidadRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("Conexión a PostgreSQL establecida");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error al conectar con la base de datos:", error);
  });