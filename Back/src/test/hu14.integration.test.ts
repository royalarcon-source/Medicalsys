import "reflect-metadata";
import axios, { AxiosInstance } from "axios";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { Especialidad } from "../entities/Especialidad.entity";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { Medico } from "../entities/Medico.entity";
import { Rol } from "../entities/Rol.entity";
import { Usuario } from "../entities/Usuario.entity";

const BASE_URL = process.env.HU14_BASE_URL ?? "http://localhost:3000/api";
const JWT_SECRET = process.env.JWT_SECRET;
const RUN_ID = Date.now().toString();
const REPORT_PATH = path.resolve(__dirname, "../../../docs/T7_HU14_Reporte_Pruebas.md");

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
let especialidadCreada: Especialidad | null = null;
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
  const especialidadRepo = AppDataSource.getRepository(Especialidad);
  const horarioRepo = AppDataSource.getRepository(HorarioDisponibilidad);
  const roles = new Map<string, Rol>();

  for (const nombre of ["ADMINISTRADOR", "MEDICO", "RECEPCIONISTA", "PACIENTE"]) {
    let rol = await rolRepo.findOne({ where: { nombre } });
    if (!rol) {
      rol = await rolRepo.save(rolRepo.create({ nombre, descripcion: `Rol temporal HU14 (${RUN_ID})` }));
      rolesCreados.push(rol);
    }
    roles.set(nombre, rol);
  }

  const passwordHash = await bcrypt.hash("HU14-test-only", 4);
  const perfiles = [
    ["Administradora", "HU14", "ADMINISTRADOR"],
    ["MedicoActivo", "HU14", "MEDICO"],
    ["MedicoInactivo", "HU14", "MEDICO"],
    ["Recepcionista", "HU14", "RECEPCIONISTA"],
    ["Paciente", "HU14", "PACIENTE"],
  ] as const;

  for (const [nombres, apellidos, rolNombre] of perfiles) {
    const usuario = usuarioRepo.create({
      rol: roles.get(rolNombre)!,
      nombres,
      apellidos,
      email: `hu14-${nombres.toLowerCase()}-${RUN_ID}@test.invalid`,
      passwordHash,
      telefono: "70000000",
      activo: true,
    });
    await usuarioRepo.save(usuario);
    usuarios.push(usuario);
  }

  especialidadCreada = await especialidadRepo.save(
    especialidadRepo.create({ nombre: `Cardiología HU14 ${RUN_ID}`, descripcion: null })
  );

  const medicoActivo = medicoRepo.create({
    usuario: usuarios[1],
    numeroColegiatura: `HU14-COL-ACT-${RUN_ID}`,
    activo: true,
    especialidades: [especialidadCreada],
  });
  await medicoRepo.save(medicoActivo);
  medicos.push(medicoActivo);

  const medicoInactivo = medicoRepo.create({
    usuario: usuarios[2],
    numeroColegiatura: `HU14-COL-INA-${RUN_ID}`,
    activo: false,
  });
  await medicoRepo.save(medicoInactivo);
  medicos.push(medicoInactivo);

  await horarioRepo.save(
    horarioRepo.create({ medico: medicoActivo, diaSemana: 2, horaInicio: "08:00", horaFin: "12:00", activo: true })
  );
  await horarioRepo.save(
    horarioRepo.create({ medico: medicoActivo, diaSemana: 5, horaInicio: "15:00", horaFin: "18:00", activo: false })
  );
  await horarioRepo.save(
    horarioRepo.create({ medico: medicoInactivo, diaSemana: 2, horaInicio: "08:00", horaFin: "12:00", activo: true })
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
    const recepcionista = auth(usuarios[3].idUsuario, "RECEPCIONISTA");
    const paciente = auth(usuarios[4].idUsuario, "PACIENTE");

    await comprobar("ST2.1", "Consultar disponibilidad por médico", async () => {
      const response = await api.get(`/disponibilidad?idMedico=${medicos[0].idMedico}`, { headers: admin });
      assert(
        response.status === 200 && response.data.resultados.length === 1,
        datosRespuesta(response)
      );
      return datosRespuesta(response);
    });

    await comprobar("ST2.2", "No incluye horarios inactivos", async () => {
      const response = await api.get(`/disponibilidad?idMedico=${medicos[0].idMedico}`, { headers: admin });
      const diasDevueltos = response.data.resultados.map((r: any) => r.diaSemana);
      assert(response.status === 200 && !diasDevueltos.includes(5), datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST2.3", "No incluye horarios de médicos inactivos", async () => {
      const response = await api.get(`/disponibilidad?idMedico=${medicos[1].idMedico}`, { headers: admin });
      assert(
        response.status === 200 && response.data.resultados.length === 0,
        datosRespuesta(response)
      );
      return datosRespuesta(response);
    });

    await comprobar("ST2.4", "Consultar disponibilidad por especialidad", async () => {
      const response = await api.get(`/disponibilidad?idEspecialidad=${especialidadCreada!.idEspecialidad}`, {
        headers: recepcionista,
      });
      assert(
        response.status === 200 &&
          response.data.resultados.some((r: any) => r.idMedico === medicos[0].idMedico),
        datosRespuesta(response)
      );
      return datosRespuesta(response);
    });

    await comprobar("ST2.5", "Consultar disponibilidad por día de la semana", async () => {
      const response = await api.get(`/disponibilidad?diaSemana=2`, { headers: paciente });
      assert(
        response.status === 200 &&
          response.data.resultados.every((r: any) => r.diaSemana === 2),
        datosRespuesta(response)
      );
      return datosRespuesta(response);
    });

    await comprobar("ST2.6", "Médico sin filtros ve su propia disponibilidad por defecto", async () => {
      const response = await api.get(`/disponibilidad`, { headers: medico });
      assert(
        response.status === 200 &&
          response.data.resultados.every((r: any) => r.idMedico === medicos[0].idMedico),
        datosRespuesta(response)
      );
      return datosRespuesta(response);
    });

    await comprobar("ST2.7", "Estructura de la respuesta incluye datos del médico", async () => {
      const response = await api.get(`/disponibilidad?idMedico=${medicos[0].idMedico}`, { headers: admin });
      const [resultado] = response.data.resultados;
      assert(
        response.status === 200 &&
          resultado &&
          typeof resultado.medicoNombre === "string" &&
          typeof resultado.numeroColegiatura === "string" &&
          Array.isArray(resultado.especialidades),
        datosRespuesta(response)
      );
      return datosRespuesta(response);
    });

    await comprobar("ST2.8", "Sin autenticación es rechazado", async () => {
      const response = await api.get(`/disponibilidad?idMedico=${medicos[0].idMedico}`);
      assert(response.status === 401, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST2.9", "Token inválido es rechazado", async () => {
      const response = await api.get(`/disponibilidad?idMedico=${medicos[0].idMedico}`, {
        headers: { Authorization: "Bearer token-invalido" },
      });
      assert(response.status === 401, datosRespuesta(response));
      return datosRespuesta(response);
    });

    await comprobar("ST2.10", "Consultas ejecutadas correctamente en PostgreSQL", async () => {
      const count = await AppDataSource.getRepository(HorarioDisponibilidad)
        .createQueryBuilder("horario")
        .where("horario.medico = :idMedico", { idMedico: medicos[0].idMedico })
        .getCount();
      assert(count === 2, `PostgreSQL devolvió ${count} horarios`);
      return `PostgreSQL conectado; count(horario_disponibilidad)=${count}`;
    });
  } catch (error) {
    const evidencia = error instanceof Error ? error.message : String(error);
    if (!conexionPostgres || /ECONNREFUSED|ENOTFOUND|Servidor no disponible/i.test(evidencia)) {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-14", estado: "BLOQUEADA", evidencia });
    } else {
      resultados.push({ id: "SETUP", nombre: "Preparación del entorno HU-14", estado: "FALLÓ", evidencia });
    }
    console.error(`✗ Preparación: ${evidencia}`);
  } finally {
    for (const medico of medicos) {
      await AppDataSource.getRepository(HorarioDisponibilidad)
        .createQueryBuilder()
        .delete()
        .where("id_medico = :idMedico", { idMedico: medico.idMedico })
        .execute();
      // limpiar la tabla intermedia medico_especialidad antes de borrar el médico (fk_4)
      await AppDataSource.query("DELETE FROM medico_especialidad WHERE id_medico = $1", [medico.idMedico]);
      await AppDataSource.getRepository(Medico).delete(medico.idMedico);
    }
    if (especialidadCreada) {
      await AppDataSource.getRepository(Especialidad).delete(especialidadCreada.idEspecialidad);
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
    "# T7_HU14 - Reporte de pruebas",
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
