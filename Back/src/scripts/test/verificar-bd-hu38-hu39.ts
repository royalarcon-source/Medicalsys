/**
 * Script de verificación en tiempo de ejecución para HU-38 (Cifrado) y HU-39 (Auditoría)
 * en la base de datos PostgreSQL/Supabase real.
 */
import { AppDataSource } from "../../config/database";
import { AuditLogService } from "../../services/AuditLogService";
import { Paciente } from "../../entities/Paciente.entity";
import { encrypt, decrypt } from "../../utils/encryption";

async function verificarBD() {
  console.log("======================================================================");
  console.log("🔍 COMPROBACIÓN DE MIGRACIONES Y ENTORNO REAL (HU-38 & HU-39)");
  console.log("======================================================================\n");

  await AppDataSource.initialize();
  console.log("✓ Conexión con PostgreSQL establecida.\n");

  // 1. Verificación de HU-39 (Tabla audit_log)
  console.log("--- 1. VERIFICACIÓN HU-39: TABLA Y REGISTRO DE AUDITORÍA ---");
  const logCreado = await AuditLogService.registrar({
    accion: "VERIFICACION_MIGRACION",
    entidad: "Sistema",
    resultado: "EXITO",
    ip: "127.0.0.1",
    userAgent: "ScriptVerificacion/1.0",
    detalle: { mensaje: "Comprobando migración de auditoría exitosa" },
  });

  console.log(`  ✓ Registro de auditoría guardado con éxito. ID Log: #${logCreado?.idLog || 'OK'}`);
  
  const { registros } = await AuditLogService.listar({ accion: "VERIFICACION_MIGRACION", limit: 1 });
  if (registros.length === 0) {
    throw new Error("No se pudo consultar el registro de auditoría recién creado.");
  }
  console.log(`  ✓ Consulta de auditoría realizada correctamente. Acción: "${registros[0].accion}"`);
  console.log("✓ VERIFICACIÓN HU-39 SUPERADA EXITOSAMENTE.\n");

  // 2. Verificación de HU-38 (Cifrado en BD vs Descifrado en ORM)
  console.log("--- 2. VERIFICACIÓN HU-38: CIFRADO EN BD REAL ---");
  const pacienteRepo = AppDataSource.getRepository(Paciente);

  const direccionPrueba = "Av. Arce #2414, Edificio Illimani, Piso 5";
  const contactoPrueba = "María López - 77799988";
  const ciPrueba = `VERIF-${Date.now()}`;

  const pacienteGuardado = pacienteRepo.create({
    documentoIdentidad: ciPrueba,
    fechaNacimiento: new Date("1995-05-15"),
    sexo: "Masculino",
    direccion: direccionPrueba,
    contactoEmergencia: contactoPrueba,
    telefonoEmergencia: "70011223",
  });

  await pacienteRepo.save(pacienteGuardado);
  console.log(`  ✓ Paciente de prueba creado (ID: ${pacienteGuardado.idPaciente}).`);

  // Consulta RAW SQL directa a PostgreSQL (para ver lo que realmente se guardó en el disco)
  const rawRows = await AppDataSource.query(
    `SELECT direccion, contacto_emergencia FROM paciente WHERE id_paciente = $1`,
    [pacienteGuardado.idPaciente]
  );

  const rawDireccion = rawRows[0].direccion;
  const rawContacto = rawRows[0].contacto_emergencia;

  console.log(`\n  📌 DATO RAW EN BASE DE DATOS (SQL Directo):`);
  console.log(`     - DB 'direccion': "${rawDireccion}"`);
  console.log(`     - DB 'contacto_emergencia': "${rawContacto}"`);

  if (!rawDireccion.includes(":") || rawDireccion.includes("Av. Arce")) {
    throw new Error("EL DATO NO SE GUARDÓ CIFRADO EN LA BASE DE DATOS.");
  }
  console.log("  ✓ ¡Confirmado! En PostgreSQL la información está almacenada en formato cifrado iv:authTag:ciphertext.");

  // Consulta vía TypeORM (para verificar que la app lee el dato descifrado automáticamente)
  const pacienteLeido = await pacienteRepo.findOneBy({ idPaciente: pacienteGuardado.idPaciente });
  console.log(`\n  📖 DATO LEÍDO POR LA APLICACIÓN (TypeORM):`);
  console.log(`     - App 'direccion': "${pacienteLeido?.direccion}"`);
  console.log(`     - App 'contacto_emergencia': "${pacienteLeido?.contacto_emergencia || pacienteLeido?.contactoEmergencia}"`);

  if (pacienteLeido?.direccion !== direccionPrueba) {
    throw new Error("El dato leído por la aplicación no coincide con la dirección original.");
  }
  console.log("  ✓ ¡Confirmado! La aplicación descifra los datos de forma transparente.");

  // Limpieza de datos de prueba
  await pacienteRepo.delete(pacienteGuardado.idPaciente);
  console.log("\n  ✓ Datos de prueba eliminados de la base de datos.");

  console.log("\n======================================================================");
  console.log("🎉 VERIFICACIÓN COMPLETA DE MIGRACIONES EN BASE DE DATOS OK");
  console.log("======================================================================\n");

  await AppDataSource.destroy();
}

verificarBD().catch(async (err) => {
  console.error("💥 Error durante la verificación en BD:", err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
