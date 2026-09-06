// src/scripts/test/crear-usuarios-pacientes-prueba.ts
/**
 * Script para crear usuarios y pacientes de prueba para HU-10
 * 
 * Requisitos:
 * 1. BD debe estar corriendo y conectada
 * 2. Debe existir un rol con id_rol = 4 (PACIENTE)
 * 
 * Ejecutar:
 * npx ts-node src/scripts/test/crear-usuarios-pacientes-prueba.ts
 */

import { AppDataSource } from "../../config/database";
import { Usuario } from "../../entities/Usuario.entity";
import { Paciente } from "../../entities/Paciente.entity";
import { Rol } from "../../entities/Rol.entity";
import bcrypt from "bcrypt";

async function crearUsuariosPacientesPrueba() {
  try {
    await AppDataSource.initialize();
    console.log("✓ Conexión a BD establecida");

    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const rolRepo = AppDataSource.getRepository(Rol);

    // Obtener rol PACIENTE (id_rol = 4)
    const rolPaciente = await rolRepo.findOne({
      where: { nombre: "PACIENTE" },
    });

    if (!rolPaciente) {
      throw new Error("No existe rol PACIENTE en la BD. Crea el rol primero.");
    }

    console.log("\n📋 Creando usuarios pacientes de prueba...\n");

    const usuariosPrueba = [
      {
        nombres: "Juan Carlos",
        apellidos: "Pérez López",
        email: "juan.perez@test.com",
        telefono: "70000000",
        ci: "12345678",
        fechaNacimiento: new Date("2000-05-20"),
        sexo: "Masculino",
        direccion: "Calle Principal 123",
        contactoEmergencia: "María Pérez",
        telefonoEmergencia: "70000001",
      },
      {
        nombres: "María",
        apellidos: "Pérez Gómez",
        email: "maria.perez@test.com",
        telefono: "71111111",
        ci: "87654321",
        fechaNacimiento: new Date("1998-03-14"),
        sexo: "Femenino",
        direccion: "Avenida Central 456",
        contactoEmergencia: "Carlos Gómez",
        telefonoEmergencia: "71111112",
      },
      {
        nombres: "Carlos",
        apellidos: "Pérez Vargas",
        email: "carlos.perez@test.com",
        telefono: "72222222",
        ci: "11111111",
        fechaNacimiento: new Date("1995-12-25"),
        sexo: "Masculino",
        direccion: "Plaza Mayor 789",
        contactoEmergencia: "Ana Vargas",
        telefonoEmergencia: "72222223",
      },
      {
        nombres: "Ana",
        apellidos: "García Martínez",
        email: "ana.garcia@test.com",
        telefono: "73333333",
        ci: "22222222",
        fechaNacimiento: new Date("2001-07-08"),
        sexo: "Femenino",
        direccion: "Calle Secundaria 321",
        contactoEmergencia: "Roberto García",
        telefonoEmergencia: "73333334",
      },
    ];

    const usuariosCreados: { usuario: Usuario; paciente: Paciente }[] = [];
    const passwordHash = await bcrypt.hash("test123456", 10);

    for (const datosPrueba of usuariosPrueba) {
      // Verificar si el usuario ya existe
      const usuarioExistente = await usuarioRepo.findOne({
        where: { email: datosPrueba.email },
      });

      if (usuarioExistente) {
        console.log(`⚠ Usuario ${datosPrueba.email} ya existe, omitiendo...`);
        continue;
      }

      // Crear usuario
      const usuario = usuarioRepo.create({
        rol: rolPaciente,
        nombres: datosPrueba.nombres,
        apellidos: datosPrueba.apellidos,
        email: datosPrueba.email,
        passwordHash,
        telefono: datosPrueba.telefono,
        activo: true,
      });

      await usuarioRepo.save(usuario);

      // Crear paciente
      const paciente = pacienteRepo.create({
        usuario,
        documentoIdentidad: datosPrueba.ci,
        fechaNacimiento: datosPrueba.fechaNacimiento,
        sexo: datosPrueba.sexo,
        direccion: datosPrueba.direccion,
        contactoEmergencia: datosPrueba.contactoEmergencia,
        telefonoEmergencia: datosPrueba.telefonoEmergencia,
      });

      await pacienteRepo.save(paciente);

      usuariosCreados.push({ usuario, paciente });
      console.log(`✓ Creado: ${usuario.nombres} ${usuario.apellidos}`);
    }

    // Mostrar resumen
    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ USUARIOS PACIENTES CREADOS");
    console.log(`${"=".repeat(60)}\n`);

    usuariosCreados.forEach((item) => {
      console.log(`ID Paciente: ${item.paciente.idPaciente}`);
      console.log(`Nombre: ${item.usuario.nombres} ${item.usuario.apellidos}`);
      console.log(`Email: ${item.usuario.email}`);
      console.log(`CI: ${item.paciente.documentoIdentidad}`);
      console.log(`Teléfono: ${item.usuario.telefono}`);
      console.log("---");
    });

    console.log("\n💡 Estos datos están listos para pruebas.\n");
    console.log("Ejecuta: npx ts-node src/scripts/test/probar-paciente.ts\n");

    await AppDataSource.destroy();
  } catch (error) {
    console.error("\n💥 Error:", error instanceof Error ? error.message : error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

crearUsuariosPacientesPrueba();
