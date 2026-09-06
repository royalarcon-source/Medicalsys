import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "consultorio" })
export class Consultorio {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_consultorio" })
  idConsultorio: number;

  @Column({ type: "varchar", length: 100 })
  nombre: string;

  @Column({ type: "varchar", length: 50 })
  tipo: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  piso: string | null;

  @Column({ type: "int", default: 1 })
  capacidad: number;

  @Column({ type: "boolean", default: true })
  activo: boolean;
}