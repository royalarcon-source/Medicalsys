import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Campana } from "../entities/Campana.entity";
import { Cita } from "../entities/Cita.entity";
import { Consentimiento } from "../entities/Consentimiento.entity";
import { Consulta } from "../entities/Consulta.entity";
import { Consultorio } from "../entities/Consultorio.entity";
import { DetalleFactura } from "../entities/DetalleFactura.entity";
import { Diagnostico } from "../entities/Diagnostico.entity";
import { Documento } from "../entities/Documento.entity";
import { Especialidad } from "../entities/Especialidad.entity";
import { Factura } from "../entities/Factura.entity";
import { HistoriaClinica } from "../entities/HistoriaClinica.entity";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { Medico } from "../entities/Medico.entity";
import { Notificacion } from "../entities/Notificacion.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Promocion } from "../entities/Promocion.entity";
import { Rol } from "../entities/Rol.entity";
import { Servicio } from "../entities/Servicio.entity";
import { Tratamiento } from "../entities/Tratamiento.entity";
import { Usuario } from "../entities/Usuario.entity";
import { InitialSchemaBaseline1787529278750 } from "../migrations/1787529278750-InitialSchemaBaseline";
import { CreateDocumentoTable1788566400000 } from "../migrations/1788566400000-CreateDocumentoTable";
import { AddConsultaToDocumento1788566500000 } from "../migrations/1788566500000-AddConsultaToDocumento";

dotenv.config();

// process.env siempre es `string | undefined`; con `strict` hay que resolver el undefined aquí
function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno ${key} (revisa tu archivo .env)`);
  }
  return value;
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env("DB_HOST", "localhost"),
  port: Number(env("DB_PORT", "5432")),
  username: env("DB_USERNAME"),
  password: env("DB_PASSWORD", ""),
  database: env("DB_DATABASE"),
  synchronize: false, // NUNCA true en un proyecto con migraciones — sincronizaría el schema automáticamente y te pisa las migraciones
  logging: process.env.NODE_ENV === "development",
  ssl:
  {
    rejectUnauthorized: false,
  },
  entities: [
    Campana, Cita, Consentimiento, Consulta, Consultorio, DetalleFactura,
    Diagnostico, Documento, Especialidad, Factura, HistoriaClinica,
    HorarioDisponibilidad, Medico, Notificacion, Paciente, Promocion, Rol,
    Servicio, Tratamiento, Usuario,
  ],
  migrations: [
    InitialSchemaBaseline1787529278750,
    CreateDocumentoTable1788566400000,
    AddConsultaToDocumento1788566500000,
  ],
});
