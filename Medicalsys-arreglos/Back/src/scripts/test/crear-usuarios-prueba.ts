import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { Usuario } from "../../entities/Usuario.entity";
import { Rol } from "../../entities/Rol.entity";
import { MedicoService } from "../../services/MedicoService";

const DOMINIO_PRUEBA = "@test.medicalsys.com";

async function obtenerORol(rolRepo: any, nombre: string, descripcion: string) {
  let rol = await rolRepo.findOne({ where: { nombre } });
  if (!rol) {
    rol = await rolRepo.save(rolRepo.create({ nombre, descripcion }));
    console.log(`  (rol ${nombre} creado porque no existía)`);
  }
  return rol;
}

async function main() {
  await AppDataSource.initialize();
  console.log("✅ Conectado a la BD\n");

  const rolRepo = AppDataSource.getRepository(Rol);
  const usuarioRepo = AppDataSource.getRepository(Usuario);

  const rolMedico = await obtenerORol(rolRepo, "MEDICO", "Médico");
  const rolAdmin = await obtenerORol(rolRepo, "ADMINISTRADOR", "Administrador");

  const timestamp = Date.now();

  // 1. Usuario con rol MEDICO, SIN perfil de médico todavía → caso feliz para POST /api/medicos
  const usuarioListo = await usuarioRepo.save(
    usuarioRepo.create({
      nombres: "Carlos",
      apellidos: "Gutiérrez",
      email: `medico.listo.${timestamp}${DOMINIO_PRUEBA}`,
      passwordHash: "hash-de-prueba",
      rol: rolMedico,
    })
  );
  console.log(`✅ Usuario LISTO PARA REGISTRAR (rol MEDICO, sin perfil):`);
  console.log(`   id_usuario = ${usuarioListo.idUsuario}\n`);

  // 2. Usuario con rol ADMINISTRADOR → para probar el 400 (rol incorrecto)
  const usuarioRolIncorrecto = await usuarioRepo.save(
    usuarioRepo.create({
      nombres: "Laura",
      apellidos: "Fernández",
      email: `admin.prueba.${timestamp}${DOMINIO_PRUEBA}`,
      passwordHash: "hash-de-prueba",
      rol: rolAdmin,
    })
  );
  console.log(`✅ Usuario con ROL INCORRECTO (ADMINISTRADOR, no MEDICO):`);
  console.log(`   id_usuario = ${usuarioRolIncorrecto.idUsuario}`);
  console.log(`   → usar este ID en POST /api/medicos debería dar 400\n`);

  // 3. Usuario con rol MEDICO Y perfil YA creado → para probar el 409 (duplicado)
  const usuarioConPerfil = await usuarioRepo.save(
    usuarioRepo.create({
      nombres: "Roberto",
      apellidos: "Vega",
      email: `medico.duplicado.${timestamp}${DOMINIO_PRUEBA}`,
      passwordHash: "hash-de-prueba",
      rol: rolMedico,
    })
  );
  await MedicoService.registrar({
    idUsuario: usuarioConPerfil.idUsuario,
    numeroColegiatura: `MED-YA-EXISTE-${timestamp}`,
  });
  console.log(`✅ Usuario CON PERFIL YA CREADO (para probar duplicado):`);
  console.log(`   id_usuario = ${usuarioConPerfil.idUsuario}`);
  console.log(`   → usar este ID en POST /api/medicos debería dar 409\n`);

  console.log("🏁 Usuarios de prueba listos. Copiá los IDs de arriba para usar en Postman.");

  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error("💥 Error creando usuarios de prueba:", error);
  process.exit(1);
});