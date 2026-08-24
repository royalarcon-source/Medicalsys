import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { Usuario } from "../../entities/Usuario.entity";
import { Medico } from "../../entities/Medico.entity";

const DOMINIO_PRUEBA = "@test.medicalsys.com";

async function main() {
  await AppDataSource.initialize();
  console.log("✅ Conectado a la BD\n");

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const medicoRepo = AppDataSource.getRepository(Medico);

  // Buscar todos los usuarios de prueba por el dominio de correo
  const usuariosPrueba = await usuarioRepo
    .createQueryBuilder("usuario")
    .where("usuario.email LIKE :dominio", { dominio: `%${DOMINIO_PRUEBA}` })
    .getMany();

  if (usuariosPrueba.length === 0) {
    console.log("No hay usuarios de prueba para borrar.");
    await AppDataSource.destroy();
    return;
  }

  console.log(`Encontrados ${usuariosPrueba.length} usuarios de prueba:\n`);
  usuariosPrueba.forEach((u) => console.log(`  - ${u.idUsuario}: ${u.email}`));
  console.log("");

  const idsUsuarios = usuariosPrueba.map((u) => u.idUsuario);

  // 1. Borrar primero los perfiles de médico asociados (por la FK)
  const resultadoMedicos = await medicoRepo
    .createQueryBuilder()
    .delete()
    .where("id_usuario IN (:...ids)", { ids: idsUsuarios })
    .execute();
  console.log(`🗑️  Perfiles de médico borrados: ${resultadoMedicos.affected}`);

  // 2. Ahora sí, borrar los usuarios
  const resultadoUsuarios = await usuarioRepo
    .createQueryBuilder()
    .delete()
    .where("id_usuario IN (:...ids)", { ids: idsUsuarios })
    .execute();
  console.log(`🗑️  Usuarios borrados: ${resultadoUsuarios.affected}`);

  console.log("\n🏁 Limpieza completa.");
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error("💥 Error limpiando datos de prueba:", error);
  process.exit(1);
});