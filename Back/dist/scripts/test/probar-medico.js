"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/test/probar-medico.ts
require("reflect-metadata");
const database_1 = require("../../config/database");
const Usuario_entity_1 = require("../../entities/Usuario.entity");
const Rol_entity_1 = require("../../entities/Rol.entity");
const Medico_entity_1 = require("../../entities/Medico.entity");
const MedicoService_1 = require("../../services/MedicoService");
async function main() {
    await database_1.AppDataSource.initialize();
    console.log("✅ Conectado a la BD\n");
    const rolRepo = database_1.AppDataSource.getRepository(Rol_entity_1.Rol);
    const usuarioRepo = database_1.AppDataSource.getRepository(Usuario_entity_1.Usuario);
    // Guardamos referencias a lo que vayamos creando, para poder limpiarlo al final
    let usuarioCreado = null;
    let rolCreadoParaPrueba = false;
    let idMedicoCreado = null;
    try {
        // 1. Buscar el rol MEDICO (debería existir ya, cargado como catálogo fijo en HU-07)
        let rolMedico = await rolRepo.findOne({ where: { nombre: "MEDICO" } });
        if (!rolMedico) {
            console.log("⚠️  No existe el rol MEDICO todavía, creándolo para la prueba...");
            rolMedico = await rolRepo.save(rolRepo.create({ nombre: "MEDICO", descripcion: "Médico" }));
            rolCreadoParaPrueba = true; // marcamos para borrarlo al final SOLO si lo creamos nosotros
        }
        // 2. Crear un usuario de prueba con ese rol
        const emailPrueba = `medico.prueba.${Date.now()}@medicalsys.com`;
        usuarioCreado = await usuarioRepo.save(usuarioRepo.create({
            nombres: "Juan",
            apellidos: "Pérez",
            email: emailPrueba,
            passwordHash: "hash-de-prueba-no-real", // en HU-05 real esto viene de bcrypt
            rol: rolMedico,
        }));
        console.log(`✅ Usuario de prueba creado: ${usuarioCreado.idUsuario} (${usuarioCreado.email})\n`);
        // 3. Registrar el perfil de médico (HU-11)
        const numeroColegiatura = `MED-TEST-${Date.now()}`;
        const medico = await MedicoService_1.MedicoService.registrar({
            idUsuario: usuarioCreado.idUsuario,
            numeroColegiatura,
        });
        idMedicoCreado = medico.idMedico;
        console.log(`✅ Médico registrado: id=${medico.idMedico}, colegiatura=${medico.numeroColegiatura}\n`);
        // 4. Buscarlo por ID
        const encontradoPorId = await MedicoService_1.MedicoService.buscarPorId(medico.idMedico);
        console.log(`✅ Encontrado por ID: ${encontradoPorId.idMedico} — usuario: ${encontradoPorId.usuario.nombres}\n`);
        // 5. Buscarlo por número de colegiatura
        const encontradoPorColegiatura = await MedicoService_1.MedicoService.buscarPorNumeroColegiatura(numeroColegiatura);
        console.log(`✅ Encontrado por colegiatura: ${encontradoPorColegiatura.idMedico}\n`);
        // 6. Probar que falla si intentamos duplicar (CA-03 / CA-05)
        try {
            await MedicoService_1.MedicoService.registrar({ idUsuario: usuarioCreado.idUsuario, numeroColegiatura: "OTRO-NUMERO" });
            console.log("❌ ERROR: no debería haber permitido un segundo perfil para el mismo usuario");
        }
        catch (e) {
            console.log(`✅ Rechazó correctamente el duplicado: "${e.message}"\n`);
        }
    }
    finally {
        // 7. Limpieza — corre siempre, incluso si algo falló arriba
        console.log("🧹 Limpiando datos de prueba...");
        const medicoRepo = database_1.AppDataSource.getRepository(Medico_entity_1.Medico);
        // Borrar primero Medico (tiene la FK hacia Usuario)
        if (idMedicoCreado !== null) {
            await medicoRepo.delete({ idMedico: idMedicoCreado });
            console.log(`   🗑️  Médico ${idMedicoCreado} eliminado`);
        }
        // Después Usuario
        if (usuarioCreado !== null) {
            await usuarioRepo.delete({ idUsuario: usuarioCreado.idUsuario });
            console.log(`   🗑️  Usuario ${usuarioCreado.idUsuario} eliminado`);
        }
        // Solo borramos el rol si lo creamos nosotros en este script
        // (si ya existía de antes -por HU-07-, no lo tocamos)
        if (rolCreadoParaPrueba) {
            const rolMedico = await rolRepo.findOne({ where: { nombre: "MEDICO" } });
            if (rolMedico) {
                await rolRepo.delete({ idRol: rolMedico.idRol });
                console.log(`   🗑️  Rol MEDICO (creado para la prueba) eliminado`);
            }
        }
        console.log("✅ Limpieza completa\n");
        await database_1.AppDataSource.destroy();
        console.log("🏁 Prueba terminada, conexión cerrada");
    }
}
main().catch((error) => {
    console.error("💥 Error en la prueba:", error);
    process.exit(1);
});
//# sourceMappingURL=probar-medico.js.map