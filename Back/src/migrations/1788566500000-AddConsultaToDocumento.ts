import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddConsultaToDocumento1788566500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("documento"))) return;

    const tabla = await queryRunner.getTable("documento");
    if (!tabla) return;

    if (!tabla.findColumnByName("id_consulta")) {
      await queryRunner.addColumn(
        "documento",
        new TableColumn({ name: "id_consulta", type: "bigint", isNullable: true }),
      );
    }

    const tablaActualizada = await queryRunner.getTable("documento");
    if (
      tablaActualizada &&
      !tablaActualizada.foreignKeys.some((foreignKey) => foreignKey.name === "fk_documento_consulta")
    ) {
      await queryRunner.createForeignKey(
        "documento",
        new TableForeignKey({
          name: "fk_documento_consulta",
          columnNames: ["id_consulta"],
          referencedTableName: "consulta",
          referencedColumnNames: ["id_consulta"],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("documento"))) return;

    const tabla = await queryRunner.getTable("documento");
    const foreignKey = tabla?.foreignKeys.find((item) => item.name === "fk_documento_consulta");
    if (foreignKey) {
      await queryRunner.dropForeignKey("documento", foreignKey);
    }

    if (tabla?.findColumnByName("id_consulta")) {
      await queryRunner.dropColumn("documento", "id_consulta");
    }
  }
}
