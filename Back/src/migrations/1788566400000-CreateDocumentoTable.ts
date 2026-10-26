import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDocumentoTable1788566400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("documento")) return;

    await queryRunner.createTable(
      new Table({
        name: "documento",
        columns: [
          {
            name: "id_documento",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "id_paciente", type: "bigint" },
          { name: "id_historia", type: "bigint", isNullable: true },
          { name: "id_consulta", type: "bigint", isNullable: true },
          { name: "tipo", type: "varchar", length: "50" },
          { name: "nombre_archivo", type: "varchar", length: "255" },
          { name: "mime_type", type: "varchar", length: "100" },
          { name: "tamano_bytes", type: "bigint", isNullable: true },
          { name: "storage_key", type: "varchar", length: "1000", isUnique: true },
          { name: "hash_archivo", type: "varchar", length: "128", isNullable: true },
          { name: "fecha_subida", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "activo", type: "boolean", default: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys("documento", [
      new TableForeignKey({
        name: "fk_documento_paciente",
        columnNames: ["id_paciente"],
        referencedTableName: "paciente",
        referencedColumnNames: ["id_paciente"],
      }),
      new TableForeignKey({
        name: "fk_documento_historia",
        columnNames: ["id_historia"],
        referencedTableName: "historia_clinica",
        referencedColumnNames: ["id_historia"],
      }),
      new TableForeignKey({
        name: "fk_documento_consulta",
        columnNames: ["id_consulta"],
        referencedTableName: "consulta",
        referencedColumnNames: ["id_consulta"],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("documento")) {
      await queryRunner.dropTable("documento");
    }
  }
}
