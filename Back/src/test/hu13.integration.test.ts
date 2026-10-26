import "reflect-metadata";
import axios, { AxiosInstance } from "axios";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { Medico } from "../entities/Medico.entity";
import { Rol } from "../entities/Rol.entity";
import { Usuario } from "../entities/Usuario.entity";

const BASE_URL = process.env.HU13_BASE_URL ?? "http://localhost:3000/api";
const JWT_SECRET = process.env.JWT_SECRET;
const RUN_ID = Date.now().toString();
const REPORT_PATH = path.resolve(__dirname, "../../../docs/T7_HU13_Reporte_Pruebas.md");

type Estado = "PASÓ" | "FALLÓ" | "BLOQUEADA";
interface Resultado {
  id: string;
  nombre: string;
  estado: Estado;
  evidencia: string;
}

const resultados: Resultado[] = [];
const usuarios: Usuario[] = [];
const medicos: Medico[] = [];
const rolesCreados: Rol[] = [];
const api: AxiosInstance = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

function token(idUsuario: number, rol: string): string {
  if (!JWT_SECRET) throw new Error("Falta JWT_SECRET para generar tokens de prueba");
  return jwt.sign({ id_usuario: idUsuario, rol }, JWT_SECRET, { expiresIn: "1h" });
}

function auth(idUsuario: number, rol: string) {
  return { Authorization: `Bearer ${token(idUsuario, rol)}` };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function datosRespuesta(response: { status: number; data: any }): string {
  return `HTTP ${response.status}; payload=${JSON.stringify(response.data)}`;
}

async function comprobar(id: string, nombre: string, fn: () => Promise<string>) {
  try {
    const evidencia = await fn();
    resultados.push({ id, nombre, estado: "PASÓ", evidencia });
    console.log(`✓ ${id} ${nombre}`);
  } catch (error) {
    const evidencia = error instanceof Error ? error.message : String(error);
    resultados.push({ id, nombre, estado: "FALLÓ", evidencia });
    console.log(`✗ ${id} ${nombre}: ${evidencia}`);
  }
}

async function esperarServidor(): Promise<void> {
  const response = await api.get("/disponibilidad", { validateStatus: () => true });
  if ([200, 400, 401, 403].includes(response.status)) return;
  throw new Error(`Servidor no disponible en ${BASE_URL}: ${datosRespuesta(response)}`);
}

async function crearDatos(): Promise<void> {
  const rolRepo = AppDataSource.getRepository(Rol);
  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const medicoRepo = AppDataSource.getRepository(Medico);
  const roles = new Map<string, Rol>();

  for (const nombre of ["ADMINISTRADOR", "MEDICO", "RECEPCIONISTA", "PACIENTE"]) {
    let rol = await rolRepo.findOne({ where: { nombre } });
    if (!rol) {
      rol = await rolRepo.save(rolRepo.create({ nombre, descripcion: `Rol temporal HU13 (${RUN_ID})` }));
      rolesCreados.push(rol);
    }
    roles.set(nombre, rol);
  }

  const passwordHash = await bcrypt.hash("HU13-test-only", 4);
  const perfiles = [
    ["Administradora", "HU13", "ADMINISTRADOR"],
    ["MedicoUno", "HU13", "MEDICO"],
    ["MedicoDos", "HU13", "MEDICO"],
    ["Recepcionista", "HU13", "RECEPCIONISTA"],
    ["Paciente", "HU13", "PACIENTE"],
  ] as const;

  for (const [nombres, apellidos, rolNombre] of perfiles) {
    const usuario = usuarioRepo.create({
      rol: roles.get(rolNombre)!,
      nombres,
      apellidos,
      email: `hu13-${nombres.toLowerCase()}-${RUN_ID}@test.invalid`,
      passwordHash,
      telefono: "70000000",
      activo: true,
    });
    await usuarioRepo.save(usuario);
    usuarios.push(usuario);
  }

  // usuarios[1] y usuarios[2] son MEDICO -> crear perfiles de médico
  for (const index of [1, 2]) {
    const medico = medicoRepo.create({
      usuario: usuarios[index],
      numeroColegiatura: `HU13-COL-${index}-${RUN_ID}`,
      activo: true,
    });
    await medicoRepo.save(medico);
    medicos.push(medico);
  }
}

async function ejecutar(): Promise<void> {
  let conexionPostgres = false;
  try {
    await AppDataSource.initialize();
    conexionPostgres = true;
    console.log("✓ PostgreSQL conectado");
    await crearDatos();
    await esperarServidor();

    const admin = auth(usuarios[0].idUsuario, "ADMINISTRADOR");
    const medicoUno = auth(usuarios[1].idUsuario, "MEDICO");
    const medicoDos = auth(usuarios[2].idUsuario, "MEDICO");
    const recepcionista = auth(usuarios[3].idUsuario, "RECEPCIONISTA");
    const paciente = auth(usuarios[4].idUsuario, "PACIENTE");

    let idHorarioMedicoUno = 0;

    await comprobar("ST1.1", "Médico registra su propia disponibilidad", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 1, horaInicio: "08:00", horaFin: "12:00" },
        { headers: medicoUno }
      );
      assert(response.status === 201, datosRespuesta(response));
      idHorarioMedicoUno = response.data.horario.idHorario;
      return datosRespuesta(response);
    });

    await comprobar("ST1.2", "Rechaza horario solapado para el mismo médico y día", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 1, horaInicio: "10:00", horaFin: "11:00" },
        { headers: medicoUno }
      );
      assert(response.status === 409, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.3", "Permite horario distinto sin solaparse (mismo día)", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 1, horaInicio: "14:00", horaFin: "18:00" },
        { headers: medicoUno }
      );
      assert(response.status === 201, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.4", "Rechaza diaSemana inválido", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 8, horaInicio: "08:00", horaFin: "09:00" },
        { headers: medicoUno }
      );
      assert(response.status === 400, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.5", "Rechaza horaInicio >= horaFin", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 2, horaInicio: "12:00", horaFin: "10:00" },
        { headers: medicoUno }
      );
      assert(response.status === 400, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.6", "Administrador registra disponibilidad para otro médico", async () => {
      const response = await api.post(
        "/disponibilidad",
        { idMedico: medicos[1].idMedico, diaSemana: 3, horaInicio: "09:00", horaFin: "13:00" },
        { headers: admin }
      );
      assert(response.status === 201, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.7", "Administrador sin idMedico es rechazado", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 3, horaInicio: "09:00", horaFin: "13:00" },
        { headers: admin }
      );
      assert(response.status === 400, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.8", "Recepcionista no puede registrar disponibilidad", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 4, horaInicio: "08:00", horaFin: "09:00" },
        { headers: recepcionista }
      );
      assert(response.status === 403, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.9", "Paciente no puede registrar disponibilidad", async () => {
      const response = await api.post(
        "/disponibilidad",
        { diaSemana: 4, horaInicio: "08:00", horaFin: "09:00" },
        { headers: paciente }
      );
      assert(response.status === 403, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.10", "Médico no puede editar el horario de otro médico", async () => {
      const response = await api.patch(
        `/disponibilidad/${idHorarioMedicoUno}`,
        { horaFin: "13:00" },
        { headers: medicoDos }
      );
      assert(response.status === 403, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.11", "Médico edita su propio horario", async () => {
      const response = await api.patch(
        `/disponibilidad/${idHorarioMedicoUno}`,
        { horaFin: "13:00" },
        { headers: medicoUno }
      );
      assert(
        response.status === 200 && response.data.horario.horaFin === "13:00:00",
        datosRespuesta(response)
      );
      return datosRespuesta(response);
    });

    await comprobar("ST1.12", "Médico desactiva su propio horario (baja lógica)", async () => {
      const response = await api.delete(`/disponibilidad/${idHorarioMedicoUno}`, { headers: medicoUno });
      assert(response.status === 200, datosRespuesta(response));
      const enBD = await AppDataSource.getRepository(HorarioDisponibilidad).findOne({
        where: { idHorario: idHorarioMedicoUno },
      });
      assert(enBD !== null && enBD.activo === false, "El horario debía seguir existiendo con activo=false");
      return datosRespuesta(response);
    });

    await comprobar("ST1.13", "Sin autenticación es rechazado", async () => {
      const response = await api.post("/disponibilidad", { diaSemana: 1, horaInicio: "08:00", horaFin: "09:00" });
      assert(response.status === 401, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST1.14", "Persistencia verificada en PostgreSQL", async () => {
      const count = await AppDataSource.getRepository(HorarioDisponibilidad)
        .createQueryBuilder("horario")
        .where("horario.medico = :idMedico", { idMedico: medicos[0].idMedico })
        .getCount();
      assert(count >= 2, `PostgreSQL devolvió ${count} horarios para el médico de prueba`);
      return `PostgreSQL conectado; count(horario_disponibilidad)=${count}`;
    });
  } catch (error) {
    const evidencia = error instanceof Error ? error.message : String(error);
    if (!conexionPostgres || /ECONNREFUSED|ENOTFOUND|Servidor no disponible/i.test(evidencia)) {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-13", estado: "BLOQUEADA", evidencia });
    } else {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-13", estado: "FALLÓ", evidencia });
    }
    console.error(`✗ Preparación: ${evidencia}`);
  } finally {
    for (const medico of medicos) {
      await AppDataSource.getRepository(HorarioDisponibilidad)
        .createQueryBuilder()
        .delete()
        .where("id_medico = :idMedico", { idMedico: medico.idMedico })
        .execute();
      await AppDataSource.getRepository(Medico).delete(medico.idMedico);
    }
    for (const usuario of usuarios) {
      await AppDataSource.getRepository(Usuario).delete(usuario.idUsuario);
    }
    for (const rol of rolesCreados) {
      await AppDataSource.getRepository(Rol).delete(rol.idRol);
    }
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    generarReporte();
  }
}

function generarReporte(): void {
  const pasaron = resultados.filter((resultado) => resultado.estado === "PASÓ").length;
  const fallaron = resultados.filter((resultado) => resultado.estado === "FALLÓ").length;
  const bloqueadas = resultados.filter((resultado) => resultado.estado === "BLOQUEADA").length;
  const lineas = [
    "# T7_HU13 - Reporte de pruebas",
    "",
    `- Fecha de ejecución: ${new Date().toISOString()}`,
    `- Base URL: ${BASE_URL}`,
    `- Resultado: ${pasaron} pasaron, ${fallaron} fallaron, ${bloqueadas} bloqueadas`,
    "",
    "| Subtarea | Resultado | Evidencia |",
    "|---|---|---|",
    ...resultados.map(
      (resultado) =>
        `| ${resultado.id} ${resultado.nombre} | ${resultado.estado} | ${resultado.evidencia
          .replace(/\|/g, "\\|")
          .replace(/\n/g, " ")} |`
    ),
    "",
    "## Criterio de ejecución",
    "",
    "La suite crea datos temporales, usa PostgreSQL y llama los endpoints HTTP reales con tokens JWT por rol. Los datos se eliminan en el bloque `finally`, incluso cuando una prueba falla.",
    "",
  ];
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${lineas.join("\n")}\n`, "utf8");
  console.log(`\nReporte generado: ${REPORT_PATH}`);
}

ejecutar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
