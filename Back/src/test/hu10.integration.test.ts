import "reflect-metadata";
import axios, { AxiosError, AxiosInstance } from "axios";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { Paciente } from "../entities/Paciente.entity";
import { Rol } from "../entities/Rol.entity";
import { Usuario } from "../entities/Usuario.entity";
import { PacienteService } from "../services/PacienteService";

const BASE_URL = process.env.HU10_BASE_URL ?? "http://localhost:3000/api";
const JWT_SECRET = process.env.JWT_SECRET;
const RUN_ID = Date.now().toString();
const REPORT_PATH = path.resolve(__dirname, "../../../docs/T8_HU10_Reporte_Pruebas.md");

type Estado = "PASÓ" | "FALLÓ" | "BLOQUEADA";
interface Resultado {
  id: string;
  nombre: string;
  estado: Estado;
  evidencia: string;
}

const resultados: Resultado[] = [];
const usuarios: Usuario[] = [];
const pacientes: Paciente[] = [];
const rolesCreados: Rol[] = [];
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
});

function token(idUsuario: number, rol: string): string {
  if (!JWT_SECRET) throw new Error("Falta JWT_SECRET para generar tokens de prueba");
  return jwt.sign({ idUsuario, rol: { nombre: rol }, permisos: ["PACIENTE_CONSULTAR"] }, JWT_SECRET, {
    expiresIn: "1h",
  });
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
  const response = await api.get("/pacientes", { validateStatus: () => true });
  if (response.status === 401 || response.status === 403 || response.status === 400 || response.status === 200) {
    return;
  }
  throw new Error(`Servidor no disponible en ${BASE_URL}: ${datosRespuesta(response)}`);
}

async function crearDatos(): Promise<void> {
  const rolRepo = AppDataSource.getRepository(Rol);
  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const pacienteRepo = AppDataSource.getRepository(Paciente);
  const roles = new Map<string, Rol>();

  for (const nombre of ["ADMINISTRADOR", "MEDICO", "RECEPCIONISTA", "PACIENTE"]) {
    let rol = await rolRepo.findOne({ where: { nombre } });
    if (!rol) {
      rol = await rolRepo.save(rolRepo.create({
        nombre,
        descripcion: `Rol temporal para pruebas T8_HU10 (${RUN_ID})`,
      }));
      rolesCreados.push(rol);
    }
    roles.set(nombre, rol);
  }

  const passwordHash = await bcrypt.hash("HU10-test-only", 4);
  const perfiles = [
    ["Administrador", "HU10", "ADMINISTRADOR"],
    ["Medico", "HU10", "MEDICO"],
    ["Recepcionista", "HU10", "RECEPCIONISTA"],
    ["Paciente", "HU10", "PACIENTE"],
  ] as const;

  for (const [nombres, apellidos, rolNombre] of perfiles) {
    const usuario = usuarioRepo.create({
      rol: roles.get(rolNombre)!, nombres, apellidos,
      email: `hu10-${rolNombre.toLowerCase()}-${RUN_ID}@test.invalid`,
      passwordHash, telefono: "70000000", activo: true,
    });
    await usuarioRepo.save(usuario);
    usuarios.push(usuario);
  }

  const pacientesPrueba = [
    ["Ana", "Pérez", "HU10-CI-1", "Femenino"],
    ["Bruno", "Pérez", "HU10-CI-2", "Masculino"],
    ["Carla", "Pérez", "HU10-CI-3", "Femenino"],
  ] as const;

  for (let index = 0; index < pacientesPrueba.length; index += 1) {
    const [nombres, apellidos, ci, sexo] = pacientesPrueba[index];
    const usuario = index === 0 ? usuarios[3] : usuarios[index - 1];
    const paciente = pacienteRepo.create({
      usuario, documentoIdentidad: `${ci}-${RUN_ID}`,
      fechaNacimiento: new Date("1990-01-01"), sexo,
      direccion: "Dirección de prueba HU10", contactoEmergencia: "Contacto HU10",
      telefonoEmergencia: "71111111",
    });
    usuario.nombres = nombres;
    usuario.apellidos = apellidos;
    await usuarioRepo.save(usuario);
    await pacienteRepo.save(paciente);
    pacientes.push(paciente);
  }
}

function encabezadosNoMedicos(payload: any): string {
  const prohibidos = ["historiaClinica", "diagnosticos", "tratamientos", "consultas", "recetas", "documentos", "consentimientos"];
  const encontrados = prohibidos.filter((campo) => campo in payload);
  assert(encontrados.length === 0, `Campos médicos expuestos: ${encontrados.join(", ")}`);
  return "Payload sin historia clínica, recetas ni diagnósticos";
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
    const medico = auth(usuarios[1].idUsuario, "MEDICO");
    const recepcionista = auth(usuarios[2].idUsuario, "RECEPCIONISTA");
    const paciente = auth(usuarios[3].idUsuario, "PACIENTE");
    const ci = pacientes[0].documentoIdentidad;

    await comprobar("ST8.1", "Buscar paciente por CI", async () => {
      const response = await api.get(`/pacientes?ci=${encodeURIComponent(ci)}`, { headers: admin });
      assert(response.status === 200 && response.data.total === 1, datosRespuesta(response));
      return datosRespuesta(response);
    });
    await comprobar("ST8.2", "Buscar por nombre", async () => {
      const response = await api.get("/pacientes?nombre=Ana", { headers: admin });
      assert(response.status === 200 && response.data.total >= 1, datosRespuesta(response));
      return datosRespuesta(response);
    });
    await comprobar("ST8.3", "Buscar por apellido", async () => {
      const response = await api.get("/pacientes?apellido=Pérez", { headers: admin });
      assert(response.status === 200 && response.data.total >= 3, datosRespuesta(response));
      return datosRespuesta(response);
    });
    await comprobar("ST8.4", "Buscar paciente inexistente", async () => {
      const response = await api.get("/pacientes?ci=HU10-INEXISTENTE", { headers: admin });
      assert(response.status === 200 && response.data.total === 0 && response.data.message === "No se encontraron pacientes.", datosRespuesta(response));
      return datosRespuesta(response);
    });
    await comprobar("ST8.5", "Múltiples resultados y paginación", async () => {
      const response = await api.get("/pacientes?apellido=Pérez&page=2&limit=2", { headers: admin });
      assert(response.status === 200 && response.data.total >= 3 && response.data.page === 2 && response.data.limit === 2 && response.data.resultados.length === 1, datosRespuesta(response));
      return datosRespuesta(response);
    });
    await comprobar("ST8.6", "Consultar detalle por ID", async () => {
      const response = await api.get(`/pacientes/${pacientes[0].idPaciente}`, { headers: admin });
      assert(response.status === 200 && response.data.paciente.idPaciente === pacientes[0].idPaciente, datosRespuesta(response));
      return datosRespuesta(response);
    });
    await comprobar("ST8.7", "Consultar ID inexistente", async () => {
      const response = await api.get("/pacientes/2147483647", { headers: admin });
      assert(response.status === 404, datosRespuesta(response));
      return datosRespuesta(response);
    });

    for (const [id, rol, headers] of [["ST8.8", "Administrador", admin], ["ST8.9", "Médico", medico], ["ST8.10", "Recepcionista", recepcionista]] as const) {
      await comprobar(id, `Consultar como ${rol}`, async () => {
        const response = await api.get(`/pacientes?ci=${encodeURIComponent(ci)}`, { headers });
        assert(response.status === 200, datosRespuesta(response));
        return datosRespuesta(response);
      });
    }
    await comprobar("ST8.11", "Paciente no accede a lista ni perfil ajeno", async () => {
      const lista = await api.get(`/pacientes?ci=${encodeURIComponent(ci)}`, { headers: paciente });
      const detalle = await api.get(`/pacientes/${pacientes[1].idPaciente}`, { headers: paciente });
      assert(lista.status === 403 && detalle.status === 403, `lista=${datosRespuesta(lista)}; detalle=${datosRespuesta(detalle)}`);
      return `lista=${datosRespuesta(lista)}; detalle=${datosRespuesta(detalle)}`;
    });
    await comprobar("ST8.12", "Paciente consulta su propio perfil", async () => {
      const detalle = await PacienteService.consultarPorId(pacientes[0].idPaciente, usuarios[3]);
      assert(detalle.idPaciente === pacientes[0].idPaciente, `idPaciente=${detalle.idPaciente}`);
      const response = await api.get(`/pacientes/${pacientes[0].idPaciente}`, { headers: paciente });
      assert(response.status === 403, `Endpoint general debe rechazar PACIENTE: ${datosRespuesta(response)}`);
      return `Servicio propio permitido; endpoint general=${datosRespuesta(response)}`;
    });
    await comprobar("ST8.13", "Sin autenticación o token inválido", async () => {
      const ausente = await api.get(`/pacientes?ci=${encodeURIComponent(ci)}`);
      const invalido = await api.get(`/pacientes?ci=${encodeURIComponent(ci)}`, { headers: { Authorization: "Bearer token-invalido" } });
      assert(ausente.status === 401 && invalido.status === 401, `ausente=${datosRespuesta(ausente)}; inválido=${datosRespuesta(invalido)}`);
      return `ausente=${datosRespuesta(ausente)}; inválido=${datosRespuesta(invalido)}`;
    });
    await comprobar("ST8.14", "Estructura JSON HTTP y payload", async () => {
      const response = await api.get(`/pacientes?ci=${encodeURIComponent(ci)}`, { headers: admin });
      assert(response.status === 200 && Array.isArray(response.data.resultados) && typeof response.data.total === "number" && typeof response.data.totalPages === "number", datosRespuesta(response));
      return datosRespuesta(response);
    });
    await comprobar("ST8.15", "Consultas ejecutadas correctamente en PostgreSQL", async () => {
      const count = await AppDataSource.getRepository(Paciente).count();
      assert(count >= 3, `PostgreSQL devolvió ${count} pacientes`);
      return `PostgreSQL conectado; count(paciente)=${count}`;
    });
    await comprobar("ST8.16", "Respuesta sin datos médicos de otras HU", async () => {
      const response = await api.get(`/pacientes/${pacientes[0].idPaciente}`, { headers: admin });
      assert(response.status === 200, datosRespuesta(response));
      return encabezadosNoMedicos(response.data.paciente);
    });
    await comprobar("ST8.17", "AppError sin exponer internals", async () => {
      const response = await api.get("/pacientes/0", { headers: admin });
      const mensaje = String(response.data?.error ?? "");
      assert(response.status === 400 && !/stack|TypeError|SELECT|INSERT|UPDATE|DELETE/i.test(mensaje), datosRespuesta(response));
      return datosRespuesta(response);
    });
  } catch (error) {
    const evidencia = error instanceof Error ? error.message : String(error);
    if (!conexionPostgres || /ECONNREFUSED|ENOTFOUND|Servidor no disponible/i.test(evidencia)) {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-10", estado: "BLOQUEADA", evidencia });
    } else {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-10", estado: "FALLÓ", evidencia });
    }
    console.error(`✗ Preparación: ${evidencia}`);
  } finally {
    for (const paciente of pacientes) {
      await AppDataSource.getRepository(Paciente).delete(paciente.idPaciente);
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
    "# T8_HU10 - Reporte de pruebas",
    "",
    `- Fecha de ejecución: ${new Date().toISOString()}`,
    `- Base URL: ${BASE_URL}`,
    `- Resultado: ${pasaron} pasaron, ${fallaron} fallaron, ${bloqueadas} bloqueadas`,
    "",
    "| Subtarea | Resultado | Evidencia |",
    "|---|---|---|",
    ...resultados.map((resultado) => `| ${resultado.id} ${resultado.nombre} | ${resultado.estado} | ${resultado.evidencia.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`),
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
