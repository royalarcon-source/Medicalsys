import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateAtencionServicioTable1788566600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("atencion_servicio")) return;

    await queryRunner.createTable(
      new Table({
        name: "atencion_servicio",
        columns: [
          {
            name: "id_atencion_servicio",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "id_consulta", type: "bigint", isNullable: true },
          { name: "id_paciente", type: "bigint", isNullable: false },
          { name: "id_servicio", type: "bigint", isNullable: false },
          { name: "id_factura", type: "bigint", isNullable: true },
          { name: "cantidad", type: "integer", default: 1 },
          { name: "precio_unitario", type: "numeric", precision: 12, scale: 2 },
          { name: "subtotal", type: "numeric", precision: 12, scale: 2 },
          { name: "observaciones", type: "varchar", length: "500", isNullable: true },
          { name: "estado", type: "varchar", length: "30", default: "'PENDIENTE'" },
          { name: "fecha_registro", type: "timestamp", default: "CURRENT_TIMESTAMP" },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys("atencion_servicio", [
      new TableForeignKey({
        name: "fk_atencion_servicio_consulta",
        columnNames: ["id_consulta"],
        referencedTableName: "consulta",
        referencedColumnNames: ["id_consulta"],
        onDelete: "SET NULL",
      }),
      new TableForeignKey({
        name: "fk_atencion_servicio_paciente",
        columnNames: ["id_paciente"],
        referencedTableName: "paciente",
        referencedColumnNames: ["id_paciente"],
        onDelete: "CASCADE",
      }),
      new TableForeignKey({
        name: "fk_atencion_servicio_servicio",
        columnNames: ["id_servicio"],
        referencedTableName: "servicio",
        referencedColumnNames: ["id_servicio"],
        onDelete: "RESTRICT",
      }),
      new TableForeignKey({
        name: "fk_atencion_servicio_factura",
        columnNames: ["id_factura"],
        referencedTableName: "factura",
        referencedColumnNames: ["id_factura"],
        onDelete: "SET NULL",
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("atencion_servicio")) {
      await queryRunner.dropTable("atencion_servicio");
    }
  }
}

