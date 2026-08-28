import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import authRoutes from "./routes/auth.routes";
import medicoRoutes from "./routes/medico.routes";
import especialidadRoutes from "./routes/especialidad.routes";
import { errorHandler } from "./middlewares/errorHandler";
import pacienteRoutes from "./routes/paciente.routes";
import rolRoutes from "./routes/rol.routes";
import disponibilidadRoutes from "./routes/disponibilidad.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Registro de endpoints de autenticación
app.use("/api/auth", authRoutes);
app.use("/api/medicos", medicoRoutes);
app.use("/api/especialidades", especialidadRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/disponibilidad", disponibilidadRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("Conexión a PostgreSQL establecida exitosamente.");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error al conectar con la base de datos:", error);
  });
