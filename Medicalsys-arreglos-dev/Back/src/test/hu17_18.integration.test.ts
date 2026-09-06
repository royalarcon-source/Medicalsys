// src/test/hu17_18.integration.test.ts
import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { ConsultorioService } from "../services/ConsultorioService";
import { ConsultaService } from "../services/ConsultaService";
import { citaService } from "../services/CitaService";
import { Usuario } from "../entities/Usuario.entity";
import { Rol, RolNombre } from "../entities/Rol.entity";
import { Medico } from "../entities/Medico.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Consultorio } from "../entities/Consultorio.entity";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import { Cita } from "../entities/Cita.entity";
import { Consulta } from "../entities/Consulta.entity";
import { HistoriaClinica } from "../entities/HistoriaClinica.entity";

async function ejecutarPruebas() {
  console.log("Iniciando pruebas de integración HU-17 y HU-18...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const consultorioService = new ConsultorioService();
  const consultaService = new ConsultaService();

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const rolRepo = AppDataSource.getRepository(Rol);
  const medicoRepo = AppDataSource.getRepository(Medico);
  const pacienteRepo = AppDataSource.getRepository(Paciente);
  const consultorioRepo = AppDataSource.getRepository(Consultorio);
  const horarioRepo = AppDataSource.getRepository(HorarioDisponibilidad);
  const citaRepo = AppDataSource.getRepository(Cita);
  const consultaRepo = AppDataSource.getRepository(Consulta);
  const historiaRepo = AppDataSource.getRepository(HistoriaClinica);

  const testId = Date.now();

  try {
    // Roles
    const rolAdmin = await rolRepo.findOneBy({ nombre: RolNombre.ADMINISTRADOR });
    const rolMedico = await rolRepo.findOneBy({ nombre: RolNombre.MEDICO });
    const rolPaciente = await rolRepo.findOneBy({ nombre: RolNombre.PACIENTE });

    // 1. Crear usuarios de prueba
    const uAdmin = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Admin",
        apellidos: "Test",
        email: `admin_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolAdmin!,
      })
    );

    const uMed = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Dr. Carlos",
        apellidos: "Gómez",
        email: `med_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolMedico!,
      })
    );

    const uMed2 = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Dra. Ana",
        apellidos: "Pérez",
        email: `med2_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolMedico!,
      })
    );

    const uPac = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Juan",
        apellidos: "López",
        email: `pac_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolPaciente!,
      })
    );

    const medico1 = await medicoRepo.save(
      medicoRepo.create({
        usuario: uMed,
        numeroColegiatura: `COL-${testId}`,
        activo: true,
      })
    );

    const medico2 = await medicoRepo.save(
      medicoRepo.create({
        usuario: uMed2,
        numeroColegiatura: `COL2-${testId}`,
        activo: true,
      })
    );

    const paciente1 = await pacienteRepo.save(
      pacienteRepo.create({
        usuario: uPac,
        documentoIdentidad: `CI-${testId}`,
        fechaNacimiento: new Date("1990-01-01"),
      })
    );

    // Crear 2 consultorios de prueba
    const consultorioA = await consultorioRepo.save(
      consultorioRepo.create({
        nombre: `Consultorio 101 (${testId})`,
        tipo: "MEDICINA_GENERAL",
        piso: "1",
        capacidad: 1,
        activo: true,
      })
    );

    const consultorioB = await consultorioRepo.save(
      consultorioRepo.create({
        nombre: `Consultorio 102 (${testId})`,
        tipo: "PEDIATRIA",
        piso: "1",
        capacidad: 1,
        activo: true,
      })
    );

    // Horario de atención para médico1 (Lunes 08:00 a 14:00)
    await horarioRepo.save(
      horarioRepo.create({
        medico: medico1,
        diaSemana: 1,
        horaInicio: "08:00:00",
        horaFin: "14:00:00",
        activo: true,
      })
    );

    // Horario para médico2 (Lunes 08:00 a 14:00)
    await horarioRepo.save(
      horarioRepo.create({
        medico: medico2,
        diaSemana: 1,
        horaInicio: "08:00:00",
        horaFin: "14:00:00",
        activo: true,
      })
    );

    // Próximo lunes a las 09:00
    const proxLunes = new Date();
    proxLunes.setDate(proxLunes.getDate() + ((1 + 7 - proxLunes.getDay()) % 7 || 7));
    const pad = (n: number) => String(n).padStart(2, "0");
    const fechaLunesStr = `${proxLunes.getFullYear()}-${pad(proxLunes.getMonth() + 1)}-${pad(proxLunes.getDate())}`;

    const inicioCita1 = new Date(`${fechaLunesStr}T09:00:00`);
    const finCita1 = new Date(`${fechaLunesStr}T09:30:00`);

    // ==========================================
    // PRUEBAS HU-17: ASIGNAR CONSULTORIO
    // ==========================================
    console.log("\n--- INICIO PRUEBAS HU-17 ---");

    // 1. Listar consultorios activos
    const todosConsultorios = await consultorioService.listarTodos();
    if (todosConsultorios.some((c) => c.idConsultorio === consultorioA.idConsultorio)) {
      console.log("✓ HU17.1 Listado de consultorios activos exitoso");
    } else {
      throw new Error("HU17.1 Falló: consultorio no encontrado en listado");
    }

    // 2. Crear una cita para médico 1
    const cita1 = await citaService.reservar(
      {
        idMedico: medico1.idMedico,
        idPaciente: paciente1.idPaciente,
        fechaHoraInicio: inicioCita1.toISOString(),
        fechaHoraFin: finCita1.toISOString(),
        motivo: "Revisión general",
      },
      { idUsuario: uAdmin.idUsuario, rol: "ADMINISTRADOR" }
    );

    // 3. Asignar consultorioA a cita1
    const citaConConsultorio = await consultorioService.asignarACita(
      cita1.idCita,
      consultorioA.idConsultorio,
      { idUsuario: uAdmin.idUsuario, rol: "ADMINISTRADOR" }
    );

    if (citaConConsultorio.consultorio?.idConsultorio === consultorioA.idConsultorio) {
      console.log("✓ HU17.2 Asignación exitosa de consultorio a cita");
    } else {
      throw new Error("HU17.2 Falló asignación de consultorio");
    }

    // 4. Crear cita2 para médico2 en el MISMO horario y verificar que consultorioA está ocupado
    const cita2 = await citaService.reservar(
      {
        idMedico: medico2.idMedico,
        idPaciente: paciente1.idPaciente,
        fechaHoraInicio: inicioCita1.toISOString(),
        fechaHoraFin: finCita1.toISOString(),
        motivo: "Revisión 2",
      },
      { idUsuario: uAdmin.idUsuario, rol: "ADMINISTRADOR" }
    );

    let solapamientoBloqueado = false;
    try {
      await consultorioService.asignarACita(
        cita2.idCita,
        consultorioA.idConsultorio,
        { idUsuario: uAdmin.idUsuario, rol: "ADMINISTRADOR" }
      );
    } catch (err: any) {
      if (err.message?.includes("ya cuenta con una asignación activa")) {
        solapamientoBloqueado = true;
      }
    }

    if (solapamientoBloqueado) {
      console.log("✓ HU17.3 Bloqueo de solapamiento de consultorio verificado");
    } else {
      throw new Error("HU17.3 Falló: se permitió solapamiento de consultorio");
    }

    // 5. Asignar consultorioB a cita2 (debe funcionar)
    await consultorioService.asignarACita(
      cita2.idCita,
      consultorioB.idConsultorio,
      { idUsuario: uAdmin.idUsuario, rol: "ADMINISTRADOR" }
    );
    console.log("✓ HU17.4 Asignación de consultorio alternativo exitosa");

    // 6. Liberar consultorio de cita1
    const citaLiberada = await consultorioService.liberarDeCita(
      cita1.idCita,
      { idUsuario: uAdmin.idUsuario, rol: "ADMINISTRADOR" }
    );
    if (!citaLiberada.consultorio) {
      console.log("✓ HU17.5 Liberación de consultorio exitosa");
    } else {
      throw new Error("HU17.5 Falló liberación de consultorio");
    }

    // ==========================================
    // PRUEBAS HU-18: ATENCIÓN SIN CITA (WALK-IN)
    // ==========================================
    console.log("\n--- INICIO PRUEBAS HU-18 ---");

    // 1. Registrar atención espontánea para paciente sin historia clínica previa
    const resWalkin1 = await consultaService.registrarSinCita(
      {
        idPaciente: paciente1.idPaciente,
        idMedico: medico1.idMedico,
        idConsultorio: consultorioA.idConsultorio,
        motivo: "Dolor de cabeza agudo",
        tipoIngreso: "CONSULTA_ESPONTANEA",
      },
      { idUsuario: uAdmin.idUsuario, rol: "RECEPCIONISTA" }
    );

    if (
      resWalkin1.consulta.numeroTurno === 1 &&
      resWalkin1.consulta.historia &&
      resWalkin1.consulta.tipoIngreso === "CONSULTA_ESPONTANEA"
    ) {
      console.log("✓ HU18.1 Registro walk-in y auto-creación de Historia Clínica exitoso (Turno #1)");
    } else {
      throw new Error("HU18.1 Falló registro walk-in");
    }

    // 2. Registrar segunda atención (sobrecupo) para el mismo médico
    const resWalkin2 = await consultaService.registrarSinCita(
      {
        idPaciente: paciente1.idPaciente,
        idMedico: medico1.idMedico,
        idConsultorio: consultorioA.idConsultorio,
        motivo: "Control de urgencia menor",
        tipoIngreso: "URGENCIA_MENOR",
      },
      { idUsuario: uAdmin.idUsuario, rol: "RECEPCIONISTA" }
    );

    if (resWalkin2.consulta.numeroTurno === 2) {
      console.log("✓ HU18.2 Turno secuencial incrementado correctamente (Turno #2)");
    } else {
      throw new Error("HU18.2 Falló secuencial de turno");
    }

    // 3. Médico consulta su cola de atención
    const colaMedico = await consultaService.listar(
      {},
      { idUsuario: uMed.idUsuario, rol: "MEDICO" }
    );

    if (colaMedico.length >= 2 && colaMedico[0].medico.idMedico === medico1.idMedico) {
      console.log("✓ HU18.3 Cola de atención visualizada por el médico correspondiente");
    } else {
      throw new Error("HU18.3 Falló visualización de cola del médico");
    }

    // 4. Actualizar estado de consulta: EN_ESPERA -> EN_ATENCION -> ATENDIDA
    const consultaEnAtencion = await consultaService.actualizarEstado(
      resWalkin1.consulta.idConsulta,
      "EN_ATENCION",
      { idUsuario: uMed.idUsuario, rol: "MEDICO" }
    );

    if (consultaEnAtencion.estadoConsulta === "EN_ATENCION") {
      console.log("✓ HU18.4 Transición a 'EN_ATENCION' exitosa");
    } else {
      throw new Error("HU18.4 Falló actualización de estado");
    }

    console.log("\n==========================================");
    console.log("TODAS LAS PRUEBAS DE INTEGRACIÓN PASARON EXITOSAMENTE (HU-17 y HU-18)");
    console.log("==========================================");
  } finally {
    // Limpieza de datos de prueba
    console.log("Limpiando datos de prueba...");
    await consultaRepo.query(
      `DELETE FROM consulta WHERE id_medico IN (SELECT id_medico FROM medico WHERE numero_colegiatura LIKE 'COL%${testId}%')`
    );
    await citaRepo.query(
      `DELETE FROM cita WHERE id_medico IN (SELECT id_medico FROM medico WHERE numero_colegiatura LIKE 'COL%${testId}%')`
    );
    await horarioRepo.query(
      `DELETE FROM horario_disponibilidad WHERE id_medico IN (SELECT id_medico FROM medico WHERE numero_colegiatura LIKE 'COL%${testId}%')`
    );
    await consultorioRepo.query(
      `DELETE FROM consultorio WHERE nombre LIKE '%${testId}%'`
    );
    await historiaRepo.query(
      `DELETE FROM historia_clinica WHERE id_paciente IN (SELECT id_paciente FROM paciente WHERE documento_identidad LIKE '%${testId}%')`
    );
    await pacienteRepo.query(
      `DELETE FROM paciente WHERE documento_identidad LIKE '%${testId}%'`
    );
    await medicoRepo.query(
      `DELETE FROM medico WHERE numero_colegiatura LIKE 'COL%${testId}%'`
    );
    await usuarioRepo.query(
      `DELETE FROM usuario WHERE email LIKE '%${testId}%'`
    );
    console.log("Limpieza finalizada.");
  }
}

ejecutarPruebas()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error en pruebas de integración:", err);
    process.exit(1);
  });
