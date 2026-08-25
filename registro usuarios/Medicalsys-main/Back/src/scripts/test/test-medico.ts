import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { Rol } from "../../entities/Rol.entity";
import { Usuario } from "../../entities/Usuario.entity";
import { Medico } from "../../entities/Medico.entity"; // 👈 agregado arriba
import { MedicoRepository } from "../../repositories/MedicoRepository";
import { EspecialidadRepository } from "../../repositories/EspecialidadRepository";

async function main() {
  await AppDataSource.initialize();
  console.log("✅ Conectado a la BD\n");

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const rolRepo = AppDataSource.getRepository(Rol);
  const medicoRepo = AppDataSource.getRepository(Medico); // 👈 agregado acá, reutilizable en todo el script

  let usuarioPrueba: Usuario | null = null;
  let medicoCreado: Awaited<ReturnType<typeof MedicoRepository.crear>> | null = null;

  try {
    // 1. Asegurar que exista el rol MEDICO (dato de catálogo, no se borra al final)
    let rolMedico = await rolRepo.findOne({ where: { nombre: "MEDICO" } });
    if (!rolMedico) {
      rolMedico = await rolRepo.save(rolRepo.create({ nombre: "MEDICO", descripcion: "Personal médico" }));
      console.log("✅ Rol MEDICO creado:", rolMedico);
    } else {
      console.log("ℹ️  Rol MEDICO ya existía:", rolMedico);
    }

    // 2. Crear un usuario de prueba con ese rol
    usuarioPrueba = await usuarioRepo.save(
      usuarioRepo.create({
        rol: rolMedico,
        nombres: "Juan",
        apellidos: "Pérez",
        email: `medico.prueba.${Date.now()}@test.com`,
        passwordHash: "hash-de-prueba-no-real",
        activo: true,
      })
    );
    console.log("✅ Usuario de prueba creado:", usuarioPrueba.idUsuario, usuarioPrueba.email);

    // 3. Verificar que ese usuario aún no tiene perfil de médico (CA-03 de HU-11)
    const medicoExistente = await MedicoRepository.buscarPorUsuario(usuarioPrueba.idUsuario);
    console.log("ℹ️  ¿Ya tiene perfil de médico?", medicoExistente ? "Sí" : "No");

    // 4. Crear el perfil de médico (HU-11)
    medicoCreado = await MedicoRepository.crear({
      usuarioId: usuarioPrueba.idUsuario,
      numeroColegiatura: `MED-${Date.now()}`,
    });
    console.log("✅ Médico creado:", medicoCreado.idMedico, medicoCreado.numeroColegiatura);

    // 5. Asegurar que exista la especialidad (dato de catálogo, no se borra al final)
    let especialidad = await EspecialidadRepository.buscarPorNombre("Cardiología");
    if (!especialidad) {
      especialidad = await EspecialidadRepository.save(
        EspecialidadRepository.create({ nombre: "Cardiología", descripcion: "Especialidad del corazón" })
      );
      console.log("✅ Especialidad creada:", especialidad);
    }

    // 6. Asignar la especialidad al médico (HU-12)
    const medicoConEspecialidad = await MedicoRepository.asignarEspecialidades(medicoCreado.idMedico, [especialidad]);
    console.log("✅ Especialidad asignada. Médico final:", {
      id: medicoConEspecialidad.idMedico,
      colegiatura: medicoConEspecialidad.numeroColegiatura,
      especialidades: medicoConEspecialidad.especialidades.map((e) => e.nombre),
    });
  } finally {
    // 🧹 Limpieza: pase lo que pase (éxito o error), borrar lo que este script creó
    console.log("\n🧹 Limpiando datos de prueba...");

    if (medicoCreado) {
      const medico = await medicoRepo.findOne({
        where: { idMedico: medicoCreado.idMedico },
        relations: { especialidades: true },
      });
      if (medico) {
        medico.especialidades = []; // limpiar la relación N:M primero
        await medicoRepo.save(medico);
        await medicoRepo.remove(medico);
        console.log("🗑️  Médico de prueba eliminado");
      }
    }

    if (usuarioPrueba) {
      await usuarioRepo.remove(usuarioPrueba);
      console.log("🗑️  Usuario de prueba eliminado");
    }

    await AppDataSource.destroy();
    console.log("✅ Conexión cerrada. BD queda limpia (rol y especialidad de catálogo se conservan).");
  }
}

main().catch((err) => {
  console.error("❌ Error en el script de prueba:", err);
  process.exit(1);
});