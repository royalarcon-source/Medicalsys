import { MigrationInterface, QueryRunner } from "typeorm";

// La tabla `factura` (creada fuera de las migraciones de este repo, directamente en Supabase)
// quedó con DEFAULT 'borrador' (minúscula) en la columna `estado`, mientras que su propio
// CHECK constraint solo permite los valores en mayúscula ('BORRADOR' | 'EMITIDA' | 'ANULADA' | 'PAGADA').
// La aplicación siempre setea `estado` explícito al insertar (ver FacturaService.emitir), así que
// esto no afecta al flujo normal, pero cualquier INSERT que dependa del DEFAULT violaría el CHECK.
export class FixFacturaEstadoDefault1788566700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "factura" ALTER COLUMN "estado" SET DEFAULT 'BORRADOR'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "factura" ALTER COLUMN "estado" SET DEFAULT 'borrador'`);
  }
}
