import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Medico } from "./Medico.entity";

@Entity({ name: "especialidad" })
export class Especialidad {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_especialidad" })
  idEspecialidad: number;

  @Column({ type: "varchar", length: 100, unique: true })
  nombre: string;

  @Column({ type: "varchar", length: 250, nullable: true })
  descripcion: string | null;

  @ManyToMany(() => Medico, (medico) => medico.especialidades)
  medicos: Medico[];
}