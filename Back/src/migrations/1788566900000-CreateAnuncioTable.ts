import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAnuncioTable1788566900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("anuncio")) return;

    await queryRunner.createTable(
      new Table({
        name: "anuncio",
        columns: [
          {
            name: "id_anuncio",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "titulo", type: "varchar", length: "150" },
          { name: "contenido", type: "text" },
          { name: "fecha_publicacion", type: "date", isNullable: true },
          { name: "fecha_expiracion", type: "date", isNullable: true },
          { name: "estado", type: "varchar", length: "30", default: "'BORRADOR'" },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("anuncio")) {
      await queryRunner.dropTable("anuncio");
    }
  }
}
