import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Consulta } from "./Consulta.entity";
import { encryptionTransformer } from "../utils/encryption";

@Entity({ name: "tratamiento" })
export class Tratamiento {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_tratamiento" })
  idTratamiento: number;

  @ManyToOne(() => Consulta, (consulta) => consulta.tratamientos, { nullable: false })
  @JoinColumn({ name: "id_consulta" })
  consulta: Consulta;

  @Column({ type: "text", transformer: encryptionTransformer })
  descripcion: string;

  @Column({ type: "text", nullable: true, transformer: encryptionTransformer })
  indicaciones: string | null;

  @Column({ type: "date", nullable: true, name: "fecha_inicio" })
  fechaInicio: Date | null;

  @Column({ type: "date", nullable: true, name: "fecha_fin" })
  fechaFin: Date | null;
}