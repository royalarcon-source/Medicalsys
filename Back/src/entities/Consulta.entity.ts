import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { HistoriaClinica } from "./HistoriaClinica.entity";
import { Medico } from "./Medico.entity";
import { Cita } from "./Cita.entity";
import { Consultorio } from "./Consultorio.entity";

@Entity({ name: "consulta" })
export class Consulta {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_consulta" })
  idConsulta: number;

  @ManyToOne(() => HistoriaClinica, { nullable: false })
  @JoinColumn({ name: "id_historia" })
  historia: HistoriaClinica;

  @ManyToOne(() => Medico, { nullable: false })
  @JoinColumn({ name: "id_medico" })
  medico: Medico;

  @OneToOne(() => Cita, { nullable: true })
  @JoinColumn({ name: "id_cita" })
  cita: Cita | null; // NULL = atención sin cita previa (HU-18)

  @ManyToOne(() => Consultorio, { nullable: true })
  @JoinColumn({ name: "id_consultorio" })
  consultorio: Consultorio | null;

  @CreateDateColumn({ type: "timestamp", name: "fecha_consulta" })
  fechaConsulta: Date;

  @Column({ type: "text", nullable: true })
  motivo: string | null;

  @Column({ type: "text", nullable: true })
  anamnesis: string | null;

  @Column({ type: "text", nullable: true, name: "examen_fisico" })
  examenFisico: string | null;

  @Column({ type: "text", nullable: true })
  observaciones: string | null;
}