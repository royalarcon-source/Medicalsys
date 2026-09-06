import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Medico } from "./Medico.entity";

@Entity({ name: "horario_disponibilidad" })
export class HorarioDisponibilidad {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_horario" })
  idHorario: number;

  @ManyToOne(() => Medico, { nullable: false })
  @JoinColumn({ name: "id_medico" })
  medico: Medico;

  @Column({ type: "smallint", name: "dia_semana" })
  diaSemana: number; // 1 (lunes) a 7 (domingo)

  @Column({ type: "time", name: "hora_inicio" })
  horaInicio: string;

  @Column({ type: "time", name: "hora_fin" })
  horaFin: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;
}