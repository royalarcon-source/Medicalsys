import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";
import { Medico } from "./Medico.entity";
import { Consultorio } from "./Consultorio.entity";

export type EstadoCita = "PENDIENTE" | "CONFIRMADA" | "ATENDIDA" | "CANCELADA" | "NO_ASISTIO";

@Entity({ name: "cita" })
export class Cita {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_cita" })
  idCita: number;

  @ManyToOne(() => Paciente, { nullable: false })
  @JoinColumn({ name: "id_paciente" })
  paciente: Paciente;

  @ManyToOne(() => Medico, { nullable: false })
  @JoinColumn({ name: "id_medico" })
  medico: Medico;

  @ManyToOne(() => Consultorio, { nullable: true })
  @JoinColumn({ name: "id_consultorio" })
  consultorio: Consultorio | null;

  @Column({ type: "timestamp", name: "fecha_hora_inicio" })
  fechaHoraInicio: Date;

  @Column({ type: "timestamp", name: "fecha_hora_fin" })
  fechaHoraFin: Date;

  @Column({ type: "varchar", length: 500, nullable: true })
  motivo: string | null;

  @Column({ type: "varchar", length: 30, default: "PENDIENTE" })
  estado: EstadoCita;

  @CreateDateColumn({ type: "timestamp", name: "fecha_creacion" })
  fechaCreacion: Date;
}