import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Consulta } from "./Consulta.entity";

@Entity({ name: "diagnostico" })
export class Diagnostico {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_diagnostico" })
  idDiagnostico: number;

  @ManyToOne(() => Consulta, { nullable: false })
  @JoinColumn({ name: "id_consulta" })
  consulta: Consulta;

  @Column({ type: "varchar", length: 30, nullable: true })
  codigo: string | null;

  @Column({ type: "varchar", length: 500 })
  descripcion: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  tipo: string | null;
}