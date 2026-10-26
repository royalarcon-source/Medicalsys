import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddResourceTypeToDocumento1788566800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("documento"))) return;

    const tabla = await queryRunner.getTable("documento");
    if (!tabla) return;

    if (!tabla.findColumnByName("resource_type")) {
      await queryRunner.addColumn(
        "documento",
        new TableColumn({ name: "resource_type", type: "varchar", length: "20", isNullable: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("documento"))) return;

    const tabla = await queryRunner.getTable("documento");
    if (tabla?.findColumnByName("resource_type")) {
      await queryRunner.dropColumn("documento", "resource_type");
    }
  }
}
