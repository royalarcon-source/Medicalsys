// src/test/probar-medico.ts
import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { Usuario } from "../../entities/Usuario.entity";
import { Rol } from "../../entities/Rol.entity";
import { Medico } from "../../entities/Medico.entity";
import { MedicoService } from "../../services/MedicoService";

async function main() {
  await AppDataSource.initialize();
  console.log("✅ Conectado a la BD\n");

  const rolRepo = AppDataSource.getRepository(Rol);
  const usuarioRepo = AppDataSource.getRepository(Usuario);

  // Guardamos referencias a lo que vayamos creando, para poder limpiarlo al final
  let usuarioCreado: Usuario | null = null;
  let rolCreadoParaPrueba = false;
  let idMedicoCreado: number | null = null;

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
    usuarioCreado = await usuarioRepo.save(
      usuarioRepo.create({
        nombres: "Juan",
        apellidos: "Pérez",
        email: emailPrueba,
        passwordHash: "hash-de-prueba-no-real", // en HU-05 real esto viene de bcrypt
        rol: rolMedico,
      })
    );
    console.log(`✅ Usuario de prueba creado: ${usuarioCreado.idUsuario} (${usuarioCreado.email})\n`);

    // 3. Registrar el perfil de médico (HU-11)
    const numeroColegiatura = `MED-TEST-${Date.now()}`;
    const medico = await MedicoService.registrar({
      idUsuario: usuarioCreado.idUsuario,
      numeroColegiatura,
    });
    idMedicoCreado = medico.idMedico;
    console.log(`✅ Médico registrado: id=${medico.idMedico}, colegiatura=${medico.numeroColegiatura}\n`);

    // 4. Buscarlo por ID
    const encontradoPorId = await MedicoService.buscarPorId(medico.idMedico);
    console.log(`✅ Encontrado por ID: ${encontradoPorId.idMedico} — usuario: ${encontradoPorId.usuario.nombres}\n`);

    // 5. Buscarlo por número de colegiatura
    const encontradoPorColegiatura = await MedicoService.buscarPorNumeroColegiatura(numeroColegiatura);
    console.log(`✅ Encontrado por colegiatura: ${encontradoPorColegiatura.idMedico}\n`);

    // 6. Probar que falla si intentamos duplicar (CA-03 / CA-05)
    try {
      await MedicoService.registrar({ idUsuario: usuarioCreado.idUsuario, numeroColegiatura: "OTRO-NUMERO" });
      console.log("❌ ERROR: no debería haber permitido un segundo perfil para el mismo usuario");
    } catch (e: any) {
      console.log(`✅ Rechazó correctamente el duplicado: "${e.message}"\n`);
    }
  } finally {
    // 7. Limpieza — corre siempre, incluso si algo falló arriba
    console.log("🧹 Limpiando datos de prueba...");

    const medicoRepo = AppDataSource.getRepository(Medico);

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

    await AppDataSource.destroy();
    console.log("🏁 Prueba terminada, conexión cerrada");
  }
}

main().catch((error) => {
  console.error("💥 Error en la prueba:", error);
  process.exit(1);
});