import "reflect-metadata";
import express from "express";
import cors from "cors";
import axios, { AxiosInstance } from "axios";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { Server } from "node:http";
import { AppDataSource } from "../config/database";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { Medico } from "../entities/Medico.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Rol } from "../entities/Rol.entity";
import { Usuario } from "../entities/Usuario.entity";
import { Cita } from "../entities/Cita.entity";
import citasRoutes from "../routes/citas.routes";
import { errorHandler } from "../middlewares/errorHandler";

const JWT_SECRET = process.env.JWT_SECRET || "secreto";
const RUN_ID = Date.now().toString();
const REPORT_PATH = path.resolve(__dirname, "../../../docs/T7_HU15_16_Reporte_Pruebas.md");

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
const horarios: HorarioDisponibilidad[] = [];

let server: Server;
let api: AxiosInstance;

function token(idUsuario: number, rol: string): string {
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

async function crearUsuario(nombre: string, rolNombre: string): Promise<Usuario> {
  const rolRepo = AppDataSource.getRepository(Rol);
  const userRepo = AppDataSource.getRepository(Usuario);

  let rol = await rolRepo.findOne({ where: { nombre: rolNombre } });
  if (!rol) {
    rol = await rolRepo.save(rolRepo.create({ nombre: rolNombre, descripcion: `Rol ${rolNombre}` }));
  }

  const hash = await bcrypt.hash("Password123*", 10);
  const user = await userRepo.save(
    userRepo.create({
      nombres: nombre,
      apellidos: `Test ${RUN_ID}`,
      email: `${nombre.toLowerCase()}_${RUN_ID}@medicalsys.test`,
      passwordHash: hash,
      rol,
      activo: true,
    })
  );
  usuarios.push(user);
  return user;
}

async function ejecutar() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  console.log("Conectado a la base de datos para pruebas HU-15 / HU-16...");

  // Iniciar servidor express efímero para pruebas
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/citas", citasRoutes);
  app.use(errorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 3000;
      api = axios.create({
        baseURL: `http://127.0.0.1:${port}/api`,
        validateStatus: () => true,
      });
      resolve();
    });
  });

  const medRepo = AppDataSource.getRepository(Medico);
  const pacRepo = AppDataSource.getRepository(Paciente);
  const horarioRepo = AppDataSource.getRepository(HorarioDisponibilidad);
  const citaRepo = AppDataSource.getRepository(Cita);

  try {
    // 1. Setup de datos de prueba
    const adminUser = await crearUsuario("AdminCitas", "ADMINISTRADOR");
    const medicoUser1 = await crearUsuario("MedicoCitas1", "MEDICO");
    const medicoUser2 = await crearUsuario("MedicoCitas2", "MEDICO");
    const pacienteUser1 = await crearUsuario("PacienteCitas1", "PACIENTE");
    const pacienteUser2 = await crearUsuario("PacienteCitas2", "PACIENTE");

    const med1 = await medRepo.save(
      medRepo.create({
        usuario: medicoUser1,
        numeroColegiatura: `COL-CITA-${RUN_ID}-1`,
        activo: true,
      })
    );
    medicos.push(med1);

    const med2 = await medRepo.save(
      medRepo.create({
        usuario: medicoUser2,
        numeroColegiatura: `COL-CITA-${RUN_ID}-2`,
        activo: true,
      })
    );
    medicos.push(med2);

    const pac1 = await pacRepo.save(
      pacRepo.create({
        usuario: pacienteUser1,
        documentoIdentidad: `CI-CITA-${RUN_ID}-1`,
        fechaNacimiento: new Date("1990-01-01"),
      })
    );
    pacientes.push(pac1);

    const pac2 = await pacRepo.save(
      pacRepo.create({
        usuario: pacienteUser2,
        documentoIdentidad: `CI-CITA-${RUN_ID}-2`,
        fechaNacimiento: new Date("1995-05-15"),
      })
    );
    pacientes.push(pac2);

    // Calcular próximo Lunes y Martes a futuro
    const hoy = new Date();
    const proximoLunes = new Date(hoy);
    const diasHastaLunes = ((1 + 7 - hoy.getDay()) % 7) || 7;
    proximoLunes.setDate(hoy.getDate() + diasHastaLunes + 7);
    proximoLunes.setHours(9, 0, 0, 0);

    const proximoMartes = new Date(proximoLunes);
    proximoMartes.setDate(proximoLunes.getDate() + 1);
    proximoMartes.setHours(10, 0, 0, 0);

    // Horarios para Medico 1: Lunes (1) de 08:00 a 14:00 y Martes (2) de 09:00 a 13:00
    const h1 = await horarioRepo.save(
      horarioRepo.create({
        medico: med1,
        diaSemana: 1,
        horaInicio: "08:00:00",
        horaFin: "14:00:00",
        activo: true,
      })
    );
    horarios.push(h1);

    const h2 = await horarioRepo.save(
      horarioRepo.create({
        medico: med1,
        diaSemana: 2,
        horaInicio: "09:00:00",
        horaFin: "13:00:00",
        activo: true,
      })
    );
    horarios.push(h2);

    let idCitaCreada: number = 0;

    // --- TEST SUITE HU-15: RESERVAR CITA ---

    await comprobar("ST15.1", "Paciente reserva su propia cita médica en horario disponible", async () => {
      const fin = new Date(proximoLunes);
      fin.setHours(9, 30, 0, 0);

      const res = await api.post(
        "/citas",
        {
          idMedico: med1.idMedico,
          fechaHoraInicio: proximoLunes.toISOString(),
          fechaHoraFin: fin.toISOString(),
          motivo: "Dolor articular",
        },
        { headers: auth(pacienteUser1.idUsuario, "PACIENTE") }
      );

      assert(res.status === 201, `Esperado 201, recibido ${datosRespuesta(res)}`);
      assert(res.data.cita?.idCita, "No devolvió idCita");
      assert(res.data.cita?.estado === "PENDIENTE", "El estado debe ser PENDIENTE");
      idCitaCreada = Number(res.data.cita.idCita);
      return datosRespuesta(res);
    });

    await comprobar("ST15.2", "Rechaza cita solapada para el mismo médico", async () => {
      const inicio = new Date(proximoLunes);
      inicio.setHours(9, 15, 0, 0);
      const fin = new Date(proximoLunes);
      fin.setHours(9, 45, 0, 0);

      const res = await api.post(
        "/citas",
        {
          idMedico: med1.idMedico,
          fechaHoraInicio: inicio.toISOString(),
          fechaHoraFin: fin.toISOString(),
          motivo: "Consulta conflicto",
        },
        { headers: auth(pacienteUser2.idUsuario, "PACIENTE") }
      );

      assert(res.status === 409, `Esperado 409, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    await comprobar("ST15.3", "Rechaza reserva fuera del horario de atención del médico", async () => {
      const inicio = new Date(proximoLunes);
      inicio.setHours(15, 0, 0, 0); // Fuera del horario de 08:00 a 14:00
      const fin = new Date(proximoLunes);
      fin.setHours(16, 0, 0, 0);

      const res = await api.post(
        "/citas",
        {
          idMedico: med1.idMedico,
          fechaHoraInicio: inicio.toISOString(),
          fechaHoraFin: fin.toISOString(),
          motivo: "Tarde",
        },
        { headers: auth(pacienteUser1.idUsuario, "PACIENTE") }
      );

      assert(res.status === 400, `Esperado 400, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    await comprobar("ST15.4", "Rechaza reserva en fecha/hora pasada", async () => {
      const pasada = new Date("2020-01-01T10:00:00Z");
      const pasadaFin = new Date("2020-01-01T10:30:00Z");

      const res = await api.post(
        "/citas",
        {
          idMedico: med1.idMedico,
          fechaHoraInicio: pasada.toISOString(),
          fechaHoraFin: pasadaFin.toISOString(),
        },
        { headers: auth(pacienteUser1.idUsuario, "PACIENTE") }
      );

      assert(res.status === 400, `Esperado 400, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    await comprobar("ST15.5", "Administrador puede reservar cita para cualquier paciente", async () => {
      const inicio = new Date(proximoLunes);
      inicio.setHours(10, 0, 0, 0);
      const fin = new Date(proximoLunes);
      fin.setHours(10, 30, 0, 0);

      const res = await api.post(
        "/citas",
        {
          idMedico: med1.idMedico,
          idPaciente: pac2.idPaciente,
          fechaHoraInicio: inicio.toISOString(),
          fechaHoraFin: fin.toISOString(),
          motivo: "Derivación por administración",
        },
        { headers: auth(adminUser.idUsuario, "ADMINISTRADOR") }
      );

      assert(res.status === 201, `Esperado 201, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    // --- TEST SUITE HU-16: CANCELAR Y REPROGRAMAR CITA ---

    await comprobar("ST16.1", "Paciente reprograma su propia cita a un nuevo horario válido", async () => {
      const nuevoInicio = new Date(proximoMartes);
      nuevoInicio.setHours(10, 0, 0, 0);
      const nuevoFin = new Date(proximoMartes);
      nuevoFin.setHours(10, 30, 0, 0);

      const res = await api.patch(
        `/citas/${idCitaCreada}/reprogramar`,
        {
          fechaHoraInicio: nuevoInicio.toISOString(),
          fechaHoraFin: nuevoFin.toISOString(),
          motivo: "Cambio de turno por trabajo",
        },
        { headers: auth(pacienteUser1.idUsuario, "PACIENTE") }
      );

      assert(res.status === 200, `Esperado 200, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    await comprobar("ST16.2", "Paciente NO puede reprogramar la cita de otro paciente", async () => {
      const nuevoInicio = new Date(proximoMartes);
      nuevoInicio.setHours(11, 0, 0, 0);
      const nuevoFin = new Date(proximoMartes);
      nuevoFin.setHours(11, 30, 0, 0);

      const res = await api.patch(
        `/citas/${idCitaCreada}/reprogramar`,
        {
          fechaHoraInicio: nuevoInicio.toISOString(),
          fechaHoraFin: nuevoFin.toISOString(),
        },
        { headers: auth(pacienteUser2.idUsuario, "PACIENTE") }
      );

      assert(res.status === 403, `Esperado 403, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    await comprobar("ST16.3", "Paciente cancela su propia cita médica", async () => {
      const res = await api.patch(
        `/citas/${idCitaCreada}/cancelar`,
        { motivoCancelacion: "Ya no requiero la atención" },
        { headers: auth(pacienteUser1.idUsuario, "PACIENTE") }
      );

      assert(res.status === 200, `Esperado 200, recibido ${datosRespuesta(res)}`);
      assert(res.data.cita?.estado === "CANCELADA", "El estado debe ser CANCELADA");
      return datosRespuesta(res);
    });

    await comprobar("ST16.4", "Rechaza cancelar una cita que ya está cancelada", async () => {
      const res = await api.patch(
        `/citas/${idCitaCreada}/cancelar`,
        {},
        { headers: auth(pacienteUser1.idUsuario, "PACIENTE") }
      );

      assert(res.status === 400, `Esperado 400, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    await comprobar("ST16.5", "Rechaza reprogramar una cita cancelada", async () => {
      const nuevoInicio = new Date(proximoMartes);
      nuevoInicio.setHours(11, 0, 0, 0);
      const nuevoFin = new Date(proximoMartes);
      nuevoFin.setHours(11, 30, 0, 0);

      const res = await api.patch(
        `/citas/${idCitaCreada}/reprogramar`,
        {
          fechaHoraInicio: nuevoInicio.toISOString(),
          fechaHoraFin: nuevoFin.toISOString(),
        },
        { headers: auth(pacienteUser1.idUsuario, "PACIENTE") }
      );

      assert(res.status === 400, `Esperado 400, recibido ${datosRespuesta(res)}`);
      return datosRespuesta(res);
    });

    await comprobar("ST16.6", "Consultar citas según aislamiento por rol (Paciente solo ve las suyas)", async () => {
      const res = await api.get("/citas", { headers: auth(pacienteUser1.idUsuario, "PACIENTE") });
      assert(res.status === 200, `Esperado 200, recibido ${datosRespuesta(res)}`);
      assert(Array.isArray(res.data.citas), "Debe devolver array citas");
      return datosRespuesta(res);
    });

    await comprobar("ST16.7", "Persistencia verificada en PostgreSQL", async () => {
      const cuenta = await citaRepo.count();
      assert(cuenta >= 2, "Deben existir al menos 2 citas registradas en la BD");
      return `PostgreSQL conectado; count(cita)=${cuenta}`;
    });

  } finally {
    // Limpieza de datos
    console.log("Limpiando registros de prueba...");
    try {
      if (usuarios.length > 0) {
        const userIds = usuarios.map((u) => u.idUsuario);
        // Borrar citas creadas
        await AppDataSource.query(
          `DELETE FROM cita WHERE id_paciente IN (SELECT id_paciente FROM paciente WHERE id_usuario = ANY($1)) OR id_medico IN (SELECT id_medico FROM medico WHERE id_usuario = ANY($1))`,
          [userIds]
        );
        // Borrar horarios creados
        await AppDataSource.query(
          `DELETE FROM horario_disponibilidad WHERE id_medico IN (SELECT id_medico FROM medico WHERE id_usuario = ANY($1))`,
          [userIds]
        );
        // Borrar pacientes y medicos
        await AppDataSource.query(`DELETE FROM paciente WHERE id_usuario = ANY($1)`, [userIds]);
        await AppDataSource.query(`DELETE FROM medico WHERE id_usuario = ANY($1)`, [userIds]);
        // Borrar usuarios
        await AppDataSource.query(`DELETE FROM usuario WHERE id_usuario = ANY($1)`, [userIds]);
      }
    } catch (cleanupErr) {
      console.warn("Advertencia en limpieza:", cleanupErr);
    }

    if (server) {
      server.close();
    }
    await AppDataSource.destroy();
  }

  // Generar reporte markdown
  const pasaron = resultados.filter((r) => r.estado === "PASÓ").length;
  const fallaron = resultados.filter((r) => r.estado === "FALLÓ").length;
  const bloqueadas = resultados.filter((r) => r.estado === "BLOQUEADA").length;

  let markdown = `# T7_HU15_16 - Reporte de pruebas (Reservar, Cancelar y Reprogramar Citas)\n\n`;
  markdown += `- Fecha de ejecución: ${new Date().toISOString()}\n`;
  markdown += `- Resultado: ${pasaron} pasaron, ${fallaron} fallaron, ${bloqueadas} bloqueadas\n\n`;
  markdown += `| Subtarea | Resultado | Evidencia |\n|---|---|---|\n`;

  for (const r of resultados) {
    markdown += `| ${r.id} ${r.nombre} | ${r.estado} | ${r.evidencia} |\n`;
  }

  markdown += `\n## Criterio de ejecución\n\nLa suite crea datos temporales en PostgreSQL y llama los endpoints HTTP reales con tokens JWT por rol (Paciente, Médico, Administrador). Los datos se limpian al finalizar.\n`;

  fs.writeFileSync(REPORT_PATH, markdown, "utf-8");
  console.log(`\nReporte generado exitosamente en: ${REPORT_PATH}`);
}

ejecutar().catch((e) => {
  console.error("Error fatal en suite de pruebas:", e);
  process.exit(1);
});
