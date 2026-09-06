import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "servicio" })
export class Servicio {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_servicio" })
  idServicio: number;

  @Column({ type: "varchar", length: 150, unique: true })
  nombre: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  descripcion: string | null;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  precio: string; // TypeORM devuelve NUMERIC como string por precisión — parsear en el Service

  @Column({ type: "boolean", default: true })
  activo: boolean;
}