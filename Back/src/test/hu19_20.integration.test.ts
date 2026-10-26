import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { HistoriaClinicaService } from "../services/HistoriaClinicaService";
import { ConsultaService } from "../services/ConsultaService";
import { Usuario } from "../entities/Usuario.entity";
import { Rol, RolNombre } from "../entities/Rol.entity";
import { Medico } from "../entities/Medico.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Consultorio } from "../entities/Consultorio.entity";
import { Consulta } from "../entities/Consulta.entity";
import { HistoriaClinica } from "../entities/HistoriaClinica.entity";
import { Diagnostico } from "../entities/Diagnostico.entity";
import { Tratamiento } from "../entities/Tratamiento.entity";

async function ejecutarPruebas() {
  console.log("Iniciando pruebas de integración HU-19 y HU-20...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const historiaService = new HistoriaClinicaService();
  const consultaService = new ConsultaService();

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const rolRepo = AppDataSource.getRepository(Rol);
  const medicoRepo = AppDataSource.getRepository(Medico);
  const pacienteRepo = AppDataSource.getRepository(Paciente);
  const consultorioRepo = AppDataSource.getRepository(Consultorio);
  const consultaRepo = AppDataSource.getRepository(Consulta);
  const historiaRepo = AppDataSource.getRepository(HistoriaClinica);
  const diagnosticoRepo = AppDataSource.getRepository(Diagnostico);
  const tratamientoRepo = AppDataSource.getRepository(Tratamiento);

  const testId = Date.now();

  try {
    const rolAdmin = await rolRepo.findOneBy({ nombre: RolNombre.ADMINISTRADOR });
    const rolMedico = await rolRepo.findOneBy({ nombre: RolNombre.MEDICO });
    const rolPaciente = await rolRepo.findOneBy({ nombre: RolNombre.PACIENTE });

    const uAdmin = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Admin",
        apellidos: "HU19-20",
        email: `admin_hu19_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolAdmin!,
      })
    );

    const uMed1 = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Dr. Roberto",
        apellidos: "Pérez",
        email: `med1_hu19_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolMedico!,
      })
    );

    const uMed2 = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Dra. Laura",
        apellidos: "Sánchez",
        email: `med2_hu19_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolMedico!,
      })
    );

    const uPac = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Juan",
        apellidos: "Prueba",
        email: `pac_hu19_${testId}@test.com`,
        passwordHash: "hash",
        activo: true,
        rol: rolPaciente!,
      })
    );

    const medico1 = await medicoRepo.save(
      medicoRepo.create({
        usuario: uMed1,
        numeroColegiatura: `COL-${testId}-1`,
        activo: true,
      })
    );

    const medico2 = await medicoRepo.save(
      medicoRepo.create({
        usuario: uMed2,
        numeroColegiatura: `COL-${testId}-2`,
        activo: true,
      })
    );

    const pacienteCI = `CI-${testId}`;
    const paciente = await pacienteRepo.save(
      pacienteRepo.create({
        usuario: uPac,
        documentoIdentidad: pacienteCI,
        fechaNacimiento: new Date("1995-05-12"),
      })
    );

    const consultorio = await consultorioRepo.save(
      consultorioRepo.create({
        nombre: `Consultorio HU19-${testId}`,
        tipo: "Medicina General",
        piso: "2",
        capacidad: 1,
        activo: true,
      })
    );

    console.log("1. HU-19: Buscar historia de paciente sin historia previa...");
    const resSinHistoria = await historiaService.buscarPorCI(pacienteCI);
    if (resSinHistoria.historia === null && resSinHistoria.paciente.documentoIdentidad === pacienteCI) {
      console.log("   ✅ Búsqueda correcta: paciente identificado sin historia previa.");
    } else {
      throw new Error("Fallo en búsqueda de paciente sin historia.");
    }

    console.log("2. HU-19: Apertura manual de historia clínica por Admin...");
    const historiaCreada = await historiaService.abrirManual(paciente.idPaciente, "Apertura manual test");
    if (historiaCreada && historiaCreada.idHistoria) {
      console.log(`   ✅ Historia clínica creada exitosamente ID: HC-${historiaCreada.idHistoria}`);
    } else {
      throw new Error("Fallo al abrir historia clínica manualmente.");
    }

    console.log("3. HU-19: Validación de duplicidad al abrir historia...");
    let errorDuplicidad = false;
    try {
      await historiaService.abrirManual(paciente.idPaciente);
    } catch (err: any) {
      errorDuplicidad = err.statusCode === 409;
    }
    if (errorDuplicidad) {
      console.log("   ✅ Bloqueo correcto: no se permite duplicar historia clínica.");
    } else {
      throw new Error("Fallo: se permitió duplicar historia clínica.");
    }

    console.log("4. HU-20: Crear consulta e iniciar atención médica...");
    const { consulta: consultaIniciada } = await consultaService.registrarSinCita(
      {
        idPaciente: paciente.idPaciente,
        idMedico: medico1.idMedico,
        idConsultorio: consultorio.idConsultorio,
        motivo: "Dolor abdominal agudo y fiebre",
        tipoIngreso: "URGENCIA_MENOR",
      },
      { idUsuario: uAdmin.idUsuario, rol: "ADMINISTRADOR" }
    );
    console.log(`   ✅ Consulta #${consultaIniciada.idConsulta} creada en estado: ${consultaIniciada.estadoConsulta}`);

    console.log("5. HU-20: Validación de seguridad: médico 2 no puede atender consulta de médico 1...");
    let errorPermisoMedico = false;
    try {
      await consultaService.completar(
        consultaIniciada.idConsulta,
        { motivo: "Intento ajeno" },
        { idUsuario: uMed2.idUsuario, rol: "MEDICO" }
      );
    } catch (err: any) {
      errorPermisoMedico = err.statusCode === 403;
    }
    if (errorPermisoMedico) {
      console.log("   ✅ Bloqueo de seguridad: médico no asignado rechazado con 403.");
    } else {
      throw new Error("Fallo de seguridad: otro médico pudo completar la consulta.");
    }

    console.log("6. HU-20: Completar consulta con diagnósticos y tratamientos...");
    const consultaCompletada = await consultaService.completar(
      consultaIniciada.idConsulta,
      {
        motivo: "Dolor abdominal agudo y fiebre de 48hs",
        anamnesis: "Paciente refiere dolor tipo cólico en fosa ilíaca derecha de 48 horas de evolución.",
        examenFisico: "Abdomen blando, doloroso a la palpación en punto de McBurney. Blumberg positivo. T: 38.5°C.",
        observaciones: "Se solicita interconsulta con cirugía de urgencia.",
        diagnosticos: [
          {
            codigo: "K35.8",
            descripcion: "Apendicitis aguda no especificada",
            tipo: "PRESUNTIVO",
          },
          {
            codigo: "R50.9",
            descripcion: "Fiebre, no especificada",
            tipo: "DEFINITIVO",
          },
        ],
        tratamientos: [
          {
            descripcion: "Paracetamol 1g EV",
            indicaciones: "Cada 8 horas en caso de fiebre mayor a 38°C",
            fechaInicio: "2026-08-30",
            fechaFin: "2026-09-02",
          },
          {
            descripcion: "Hidratación con Solución Fisiológica 0.9%",
            indicaciones: "Goteo continuo a 28 gotas/min",
            fechaInicio: "2026-08-30",
          },
        ],
      },
      { idUsuario: uMed1.idUsuario, rol: "MEDICO" }
    );

    if (
      consultaCompletada.estadoConsulta === "ATENDIDA" &&
      consultaCompletada.diagnosticos?.length === 2 &&
      consultaCompletada.tratamientos?.length === 2
    ) {
      console.log("   ✅ Consulta completada y guardada con diagnósticos y tratamientos.");
    } else {
      throw new Error("Fallo al guardar datos clínicos en consulta.");
    }

    console.log("7. HU-20: Inmutabilidad — No permitir modificar consulta ya ATENDIDA...");
    let errorInmutabilidad = false;
    try {
      await consultaService.completar(
        consultaIniciada.idConsulta,
        { motivo: "Modificación posterior" },
        { idUsuario: uMed1.idUsuario, rol: "MEDICO" }
      );
    } catch (err: any) {
      errorInmutabilidad = err.statusCode === 409;
    }
    if (errorInmutabilidad) {
      console.log("   ✅ Inmutabilidad garantizada: intento de modificación rechazado con 409.");
    } else {
      throw new Error("Fallo: se permitió modificar una consulta ya atendida.");
    }

    console.log("8. HU-19: Consulta de Historia Clínica completa con trazabilidad...");
    const resHistoriaCompleta = await historiaService.buscarPorCI(pacienteCI);
    if (
      resHistoriaCompleta.historia &&
      resHistoriaCompleta.consultas.length === 1 &&
      resHistoriaCompleta.consultas[0].diagnosticos?.length === 2
    ) {
      console.log("   ✅ Historia clínica recupera consultas, diagnósticos y tratamientos.");
    } else {
      throw new Error("Fallo en recuperación de historia clínica completa.");
    }

    console.log("\n==============================================");
    console.log("🎉 TODAS LAS PRUEBAS DE HU-19 Y HU-20 PASARON CON ÉXITO");
    console.log("==============================================\n");
  } catch (error) {
    console.error("❌ ERROR EN PRUEBAS HU-19 / HU-20:", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

ejecutarPruebas();
