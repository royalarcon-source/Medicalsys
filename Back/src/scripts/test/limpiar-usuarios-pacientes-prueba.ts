// src/scripts/test/limpiar-usuarios-pacientes-prueba.ts
/**
 * Script para limpiar todos los usuarios pacientes de prueba
 * 
 * Uso: npx ts-node src/scripts/test/limpiar-usuarios-pacientes-prueba.ts
 */

import { AppDataSource } from "../../config/database";
import { Usuario } from "../../entities/Usuario.entity";
import { Paciente } from "../../entities/Paciente.entity";

async function limpiarUsuariosPrueba() {
  try {
    await AppDataSource.initialize();
    console.log("✓ Conexión a BD establecida\n");

    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const pacienteRepo = AppDataSource.getRepository(Paciente);

    // Buscar usuarios de prueba (email contiene "test")
    const usuariosPrueba = await usuarioRepo.find({
      where: [
        { email: "juan.perez@test.com" },
        { email: "maria.perez@test.com" },
        { email: "carlos.perez@test.com" },
        { email: "ana.garcia@test.com" },
      ],
    });

    console.log(`Encontrados ${usuariosPrueba.length} usuario(s) de prueba\n`);

    for (const usuario of usuariosPrueba) {
      // Eliminar pacientes asociados
      const pacientes = await pacienteRepo.find({
        where: { usuario: { idUsuario: usuario.idUsuario } },
      });

      for (const paciente of pacientes) {
        await pacienteRepo.delete(paciente.idPaciente);
        console.log(`✓ Eliminado paciente: ${paciente.documentoIdentidad}`);
      }

      // Eliminar usuario
      await usuarioRepo.delete(usuario.idUsuario);
      console.log(
        `✓ Eliminado usuario: ${usuario.nombres} ${usuario.apellidos}\n`
      );
    }

    console.log(`\n✅ Limpieza completada\n`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error(
      "\n💥 Error:",
      error instanceof Error ? error.message : error
    );
    await AppDataSource.destroy();
    process.exit(1);
  }
}

limpiarUsuariosPrueba();
