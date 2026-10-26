import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandColumnsForEncryption1789000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("paciente")) {
      await queryRunner.query(`ALTER TABLE paciente ALTER COLUMN telefono_emergencia TYPE text`);
      await queryRunner.query(`ALTER TABLE paciente ALTER COLUMN contacto_emergencia TYPE text`);
      await queryRunner.query(`ALTER TABLE paciente ALTER COLUMN direccion TYPE text`);
    }

    if (await queryRunner.hasTable("factura")) {
      await queryRunner.query(`ALTER TABLE factura ALTER COLUMN nit_cliente TYPE text`);
      await queryRunner.query(`ALTER TABLE factura ALTER COLUMN razon_social TYPE text`);
    }

    if (await queryRunner.hasTable("diagnostico")) {
      await queryRunner.query(`ALTER TABLE diagnostico ALTER COLUMN descripcion TYPE text`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("paciente")) {
      await queryRunner.query(`ALTER TABLE paciente ALTER COLUMN telefono_emergencia TYPE varchar(30)`);
      await queryRunner.query(`ALTER TABLE paciente ALTER COLUMN contacto_emergencia TYPE varchar(150)`);
      await queryRunner.query(`ALTER TABLE paciente ALTER COLUMN direccion TYPE varchar(250)`);
    }

    if (await queryRunner.hasTable("factura")) {
      await queryRunner.query(`ALTER TABLE factura ALTER COLUMN nit_cliente TYPE varchar(30)`);
      await queryRunner.query(`ALTER TABLE factura ALTER COLUMN razon_social TYPE varchar(200)`);
    }

    if (await queryRunner.hasTable("diagnostico")) {
      await queryRunner.query(`ALTER TABLE diagnostico ALTER COLUMN descripcion TYPE varchar(500)`);
    }
  }
}
