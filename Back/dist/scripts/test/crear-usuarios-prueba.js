"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../../config/database");
const Usuario_entity_1 = require("../../entities/Usuario.entity");
const Rol_entity_1 = require("../../entities/Rol.entity");
const MedicoService_1 = require("../../services/MedicoService");
const DOMINIO_PRUEBA = "@test.medicalsys.com";
async function obtenerORol(rolRepo, nombre, descripcion) {
    let rol = await rolRepo.findOne({ where: { nombre } });
    if (!rol) {
        rol = await rolRepo.save(rolRepo.create({ nombre, descripcion }));
        console.log(`  (rol ${nombre} creado porque no existía)`);
    }
    return rol;
}
async function main() {
    await database_1.AppDataSource.initialize();
    console.log("✅ Conectado a la BD\n");
    const rolRepo = database_1.AppDataSource.getRepository(Rol_entity_1.Rol);
    const usuarioRepo = database_1.AppDataSource.getRepository(Usuario_entity_1.Usuario);
    const rolMedico = await obtenerORol(rolRepo, "MEDICO", "Médico");
    const rolAdmin = await obtenerORol(rolRepo, "ADMINISTRADOR", "Administrador");
    const timestamp = Date.now();
    // 1. Usuario con rol MEDICO, SIN perfil de médico todavía → caso feliz para POST /api/medicos
    const usuarioListo = await usuarioRepo.save(usuarioRepo.create({
        nombres: "Carlos",
        apellidos: "Gutiérrez",
        email: `medico.listo.${timestamp}${DOMINIO_PRUEBA}`,
        passwordHash: "hash-de-prueba",
        rol: rolMedico,
    }));
    console.log(`✅ Usuario LISTO PARA REGISTRAR (rol MEDICO, sin perfil):`);
    console.log(`   id_usuario = ${usuarioListo.idUsuario}\n`);
    // 2. Usuario con rol ADMINISTRADOR → para probar el 400 (rol incorrecto)
    const usuarioRolIncorrecto = await usuarioRepo.save(usuarioRepo.create({
        nombres: "Laura",
        apellidos: "Fernández",
        email: `admin.prueba.${timestamp}${DOMINIO_PRUEBA}`,
        passwordHash: "hash-de-prueba",
        rol: rolAdmin,
    }));
    console.log(`✅ Usuario con ROL INCORRECTO (ADMINISTRADOR, no MEDICO):`);
    console.log(`   id_usuario = ${usuarioRolIncorrecto.idUsuario}`);
    console.log(`   → usar este ID en POST /api/medicos debería dar 400\n`);
    // 3. Usuario con rol MEDICO Y perfil YA creado → para probar el 409 (duplicado)
    const usuarioConPerfil = await usuarioRepo.save(usuarioRepo.create({
        nombres: "Roberto",
        apellidos: "Vega",
        email: `medico.duplicado.${timestamp}${DOMINIO_PRUEBA}`,
        passwordHash: "hash-de-prueba",
        rol: rolMedico,
    }));
    await MedicoService_1.MedicoService.registrar({
        idUsuario: usuarioConPerfil.idUsuario,
        numeroColegiatura: `MED-YA-EXISTE-${timestamp}`,
    });
    console.log(`✅ Usuario CON PERFIL YA CREADO (para probar duplicado):`);
    console.log(`   id_usuario = ${usuarioConPerfil.idUsuario}`);
    console.log(`   → usar este ID en POST /api/medicos debería dar 409\n`);
    console.log("🏁 Usuarios de prueba listos. Copiá los IDs de arriba para usar en Postman.");
    await database_1.AppDataSource.destroy();
}
main().catch((error) => {
    console.error("💥 Error creando usuarios de prueba:", error);
    process.exit(1);
});
//# sourceMappingURL=crear-usuarios-prueba.js.map