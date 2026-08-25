import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";
import { Documento } from "./Documento.entity";
import { Consulta } from "./Consulta.entity";

@Entity({ name: "consentimiento" })
export class Consentimiento {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_consentimiento" })
  idConsentimiento: number;

  @ManyToOne(() => Paciente, { nullable: false })
  @JoinColumn({ name: "id_paciente" })
  paciente: Paciente;

  @OneToOne(() => Documento, { nullable: true })
  @JoinColumn({ name: "id_documento" })
  documento: Documento | null; // el PDF firmado, una vez generado

  @ManyToOne(() => Consulta, { nullable: true })
  @JoinColumn({ name: "id_consulta" })
  consulta: Consulta | null;

  @Column({ type: "varchar", length: 100 })
  tipo: string;

  @Column({ type: "varchar", length: 30 })
  version: string;

  @CreateDateColumn({ type: "timestamp", name: "fecha_emision" })
  fechaEmision: Date;

  @Column({ type: "timestamp", nullable: true, name: "fecha_firma" })
  fechaFirma: Date | null;

  @Column({ type: "varchar", length: 30, default: "PENDIENTE" })
  estado: string; // PENDIENTE | FIRMADO | REVOCADO

  @Column({ type: "varchar", length: 200, nullable: true, name: "firmado_por" })
  firmadoPor: string | null;
}