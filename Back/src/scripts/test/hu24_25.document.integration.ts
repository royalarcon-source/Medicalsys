import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { Documento } from "../../entities/Documento.entity";
import { HistoriaClinica } from "../../entities/HistoriaClinica.entity";
import { Paciente } from "../../entities/Paciente.entity";

const RUN_ID = Date.now().toString();
let paciente: Paciente | null = null;
let historia: HistoriaClinica | null = null;
let documento: Documento | null = null;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function ejecutar(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("✓ PostgreSQL conectado mediante AppDataSource");

    const metadata = AppDataSource.getMetadata(Documento);
    assert(metadata.tableName === "documento", `Tabla inesperada para Documento: ${metadata.tableName}`);

    const queryRunner = AppDataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      assert(await queryRunner.hasTable("documento"), "No existe la tabla documento. Ejecuta npm run migration:run en Back.");

      const tabla = await queryRunner.getTable("documento");
      const columnas = new Set(tabla?.columns.map((column) => column.name));
      for (const columna of ["id_documento", "id_paciente", "id_historia", "storage_key", "fecha_subida"]) {
        assert(columnas.has(columna), `Falta la columna documento.${columna}`);
      }
    } finally {
      await queryRunner.release();
    }
    console.log("✓ Tabla documento y columnas verificadas");

    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const historiaRepo = AppDataSource.getRepository(HistoriaClinica);
    const documentoRepo = AppDataSource.getRepository(Documento);

    paciente = await pacienteRepo.save(
      pacienteRepo.create({
        documentoIdentidad: `HU2425-${RUN_ID}`,
        fechaNacimiento: new Date("1990-01-01"),
        sexo: "F",
        direccion: "Prueba de integración HU-24/HU-25",
        contactoEmergencia: null,
        telefonoEmergencia: null,
        usuario: null,
      }),
    );

    historia = await historiaRepo.save(
      historiaRepo.create({
        paciente,
        observaciones: "Historia temporal para integración documental",
      }),
    );

    documento = await documentoRepo.save(
      documentoRepo.create({
        paciente,
        historia,
        tipo: "RESULTADO",
        nombreArchivo: "resultado-hu24-25.pdf",
        mimeType: "application/pdf",
        tamanoBytes: 1024,
        storageKey: `integration/hu24-25/${RUN_ID}/resultado.pdf`,
        hashArchivo: "hash-integracion-hu24-25",
        activo: true,
      }),
    );

    const recuperado = await documentoRepo.findOne({
      where: { idDocumento: documento.idDocumento },
      relations: { paciente: true, historia: true },
    });
    assert(recuperado, "No se pudo recuperar el documento persistido");
    assert(recuperado.paciente.idPaciente === paciente.idPaciente, "La relación con paciente no coincide");
    assert(recuperado.historia?.idHistoria === historia.idHistoria, "La relación con historia clínica no coincide");
    assert(recuperado.mimeType === "application/pdf", "El MIME persistido no coincide");
    assert(recuperado.storageKey === `integration/hu24-25/${RUN_ID}/resultado.pdf`, "El storage_key persistido no coincide");
    console.log("✓ Documento persistido y recuperado con sus relaciones");
    console.log("RESULTADO: VERDE");
  } catch (error) {
    console.error(`RESULTADO: ROJO - ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      try {
        if (documento) await AppDataSource.getRepository(Documento).delete(documento.idDocumento);
        if (historia) await AppDataSource.getRepository(HistoriaClinica).delete(historia.idHistoria);
        if (paciente) await AppDataSource.getRepository(Paciente).delete(paciente.idPaciente);
      } finally {
        await AppDataSource.destroy();
      }
    }
  }
}

ejecutar();
