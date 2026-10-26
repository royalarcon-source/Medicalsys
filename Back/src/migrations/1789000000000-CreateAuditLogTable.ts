import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * HU-37: Crea la tabla audit_log para registrar eventos de auditoría del sistema.
 */
export class CreateAuditLogTable1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("audit_log")) return;

    await queryRunner.createTable(
      new Table({
        name: "audit_log",
        columns: [
          {
            name: "id_log",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "id_usuario",
            type: "bigint",
            isNullable: true,
          },
          {
            name: "rol",
            type: "varchar",
            length: "30",
            isNullable: true,
          },
          {
            name: "accion",
            type: "varchar",
            length: "100",
          },
          {
            name: "entidad",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "id_entidad",
            type: "bigint",
            isNullable: true,
          },
          {
            name: "ip",
            type: "varchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "user_agent",
            type: "text",
            isNullable: true,
          },
          {
            name: "resultado",
            type: "varchar",
            length: "20",
          },
          {
            name: "detalle",
            type: "text",
            isNullable: true,
          },
          {
            name: "fecha_hora",
            type: "timestamp",
            default: "NOW()",
          },
        ],
      }),
      true,
    );

    // Índice para filtrar por usuario (consultas de auditoría frecuentes)
    await queryRunner.createIndex(
      "audit_log",
      new TableIndex({ name: "IDX_audit_log_usuario", columnNames: ["id_usuario"] }),
    );

    // Índice para filtrar por fecha (paginación y rangos de tiempo)
    await queryRunner.createIndex(
      "audit_log",
      new TableIndex({ name: "IDX_audit_log_fecha", columnNames: ["fecha_hora"] }),
    );

    // Índice para filtrar por acción
    await queryRunner.createIndex(
      "audit_log",
      new TableIndex({ name: "IDX_audit_log_accion", columnNames: ["accion"] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("audit_log")) {
      await queryRunner.dropTable("audit_log");
    }
  }
}
