import "reflect-metadata";
import axios, { AxiosInstance } from "axios";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { Consulta } from "../entities/Consulta.entity";
import { Diagnostico } from "../entities/Diagnostico.entity";
import { HistoriaClinica } from "../entities/HistoriaClinica.entity";
import { Medico } from "../entities/Medico.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Rol } from "../entities/Rol.entity";
import { Usuario } from "../entities/Usuario.entity";

const BASE_URL = process.env.HU21_BASE_URL ?? "http://localhost:3000/api";
const JWT_SECRET = process.env.JWT_SECRET;
const RUN_ID = Date.now().toString();
const REPORT_PATH = path.resolve(__dirname, "../../../docs/T7_HU21_Reporte_Pruebas.md");

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
const pacientes: Paciente[] = [];
const rolesCreados: Rol[] = [];
const api: AxiosInstance = axios.create({ baseURL: BASE_URL, validateStatus: () => true });
let consultaPrueba: Consulta | null = null;
let diagnosticoCreadoId = 0;

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
  const pacienteRepo = AppDataSource.getRepository(Paciente);
  const historiaRepo = AppDataSource.getRepository(HistoriaClinica);
  const consultaRepo = AppDataSource.getRepository(Consulta);
  const roles = new Map<string, Rol>();

  for (const nombre of ["ADMINISTRADOR", "MEDICO", "RECEPCIONISTA", "PACIENTE"]) {
    let rol = await rolRepo.findOne({ where: { nombre } });
    if (!rol) {
      rol = await rolRepo.save(rolRepo.create({ nombre, descripcion: `Rol temporal HU21 (${RUN_ID})` }));
      rolesCreados.push(rol);
    }
    roles.set(nombre, rol);
  }

  const passwordHash = await bcrypt.hash("HU21-test-only", 4);
  const perfiles = [
    ["AdminHu21", "Test", "ADMINISTRADOR"],
    ["MedicoHu21", "Test", "MEDICO"],
    ["RecepcionistaHu21", "Test", "RECEPCIONISTA"],
    ["PacienteHu21", "Test", "PACIENTE"],
  ] as const;

  for (const [nombres, apellidos, rolNombre] of perfiles) {
    const usuario = usuarioRepo.create({
      rol: roles.get(rolNombre)!,
      nombres,
      apellidos,
      email: `hu21-${nombres.toLowerCase()}-${RUN_ID}@test.invalid`,
      passwordHash,
      telefono: "70000000",
      activo: true,
    });
    await usuarioRepo.save(usuario);
    usuarios.push(usuario);
  }

  const medico = medicoRepo.create({
    usuario: usuarios[1],
    numeroColegiatura: `HU21-COL-${RUN_ID}`,
    activo: true,
  });
  await medicoRepo.save(medico);
  medicos.push(medico);

  const paciente = pacienteRepo.create({
    usuario: usuarios[3],
    documentoIdentidad: `CI-HU21-${RUN_ID}`,
    fechaNacimiento: new Date("1992-03-09"),
    sexo: "F",
    direccion: "Calle prueba 123",
    contactoEmergencia: "Contacto HU21",
    telefonoEmergencia: "71111111",
  });
  await pacienteRepo.save(paciente);
  pacientes.push(paciente);

  const historia = historiaRepo.create({
    paciente,
    observaciones: "Historia creada para pruebas de diagnóstico HU21",
  });
  const historiaGuardada = await historiaRepo.save(historia);

  consultaPrueba = await consultaRepo.save(
    consultaRepo.create({
      historia: historiaGuardada,
      medico,
      cita: null,
      consultorio: null,
      motivo: "Dolor torácico leve",
      tipoIngreso: "CONSULTA_ESPONTANEA",
      numeroTurno: 1,
      estadoConsulta: "EN_ESPERA",
      fechaConsulta: new Date(),
    })
  );
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

    await comprobar("ST21.1", "Registro exitoso con rol MEDICO", async () => {
      const response = await api.post(
        "/diagnosticos",
        { idConsulta: consultaPrueba!.idConsulta, codigo: "J00", descripcion: "Rinitis aguda", tipo: "DEFINITIVO" },
        { headers: medico }
      );
      assert(response.status === 201, datosRespuesta(response));
      diagnosticoCreadoId = response.data.diagnostico.idDiagnostico;
      return datosRespuesta(response);
    });

    await comprobar("ST21.2", "Consulta inexistente devuelve 404", async () => {
      const response = await api.post(
        "/diagnosticos",
        { idConsulta: 999999, descripcion: "Diagnóstico de prueba no existente" },
        { headers: medico }
      );
      assert(response.status === 404, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST21.3", "Paciente sin permiso recibe 403", async () => {
      const response = await api.post(
        "/diagnosticos",
        { idConsulta: consultaPrueba!.idConsulta, descripcion: "Intento no autorizado" },
        { headers: paciente }
      );
      assert(response.status === 403, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST21.4", "Recepcionista sin permiso recibe 403", async () => {
      const response = await api.post(
        "/diagnosticos",
        { idConsulta: consultaPrueba!.idConsulta, descripcion: "Intento no autorizado" },
        { headers: recepcionista }
      );
      assert(response.status === 403, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST21.5", "Validación de campos requeridos devuelve 400", async () => {
      const response = await api.post(
        "/diagnosticos",
        { idConsulta: consultaPrueba!.idConsulta, codigo: "J01" },
        { headers: medico }
      );
      assert(response.status === 400, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST21.6", "Sin autenticación recibe 401", async () => {
      const response = await api.post("/diagnosticos", {
        idConsulta: consultaPrueba!.idConsulta,
        descripcion: "Diagnóstico sin token",
      });
      assert(response.status === 401, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST21.7", "Token inválido recibe 401", async () => {
      const response = await api.post(
        "/diagnosticos",
        { idConsulta: consultaPrueba!.idConsulta, descripcion: "Diagnóstico con token inválido" },
        { headers: { Authorization: "Bearer token-invalido" } }
      );
      assert(response.status === 401, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST21.8", "Acceso administrativo con token válido", async () => {
      const response = await api.get(`/diagnosticos/${diagnosticoCreadoId}`, { headers: admin });
      assert(response.status === 200, datosRespuesta(response));
      return datosRespuesta(response);
    });
  } catch (error) {
    const evidencia = error instanceof Error ? error.message : String(error);
    if (!conexionPostgres || /ECONNREFUSED|ENOTFOUND|Servidor no disponible/i.test(evidencia)) {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-21", estado: "BLOQUEADA", evidencia });
    } else {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-21", estado: "FALLÓ", evidencia });
    }
    console.error(`✗ Preparación: ${evidencia}`);
  } finally {
    if (diagnosticoCreadoId) {
      await AppDataSource.getRepository(Diagnostico).delete(diagnosticoCreadoId);
    }
    if (consultaPrueba) {
      await AppDataSource.getRepository(Consulta).delete(consultaPrueba.idConsulta);
    }
    for (const paciente of pacientes) {
      const historiaRepo = AppDataSource.getRepository(HistoriaClinica);
      const historias = await historiaRepo.find({ where: { paciente: { idPaciente: paciente.idPaciente } } as any });
      for (const historia of historias) {
        await historiaRepo.delete(historia.idHistoria);
      }
      await AppDataSource.getRepository(Paciente).delete(paciente.idPaciente);
    }
    for (const medico of medicos) {
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
    "# T7_HU21 - Reporte de pruebas",
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
