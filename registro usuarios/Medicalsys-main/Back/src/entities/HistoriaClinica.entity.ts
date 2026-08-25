import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";

@Entity({ name: "historia_clinica" })
export class HistoriaClinica {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_historia" })
  idHistoria: number;

  @OneToOne(() => Paciente, { nullable: false })
  @JoinColumn({ name: "id_paciente" })
  paciente: Paciente;

  @CreateDateColumn({ type: "timestamp", name: "fecha_apertura" })
  fechaApertura: Date;

  @Column({ type: "text", nullable: true })
  observaciones: string | null;
}