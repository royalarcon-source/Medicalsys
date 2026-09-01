import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Usuario } from "./Usuario.entity";
import { Especialidad } from "./Especialidad.entity";

@Entity({ name: "medico" })
export class Medico {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_medico" })
  idMedico: number;

  @OneToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: "id_usuario" })
  usuario: Usuario;

  @Column({ type: "varchar", length: 50, unique: true, name: "numero_colegiatura" })
  numeroColegiatura: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @ManyToMany(() => Especialidad, (especialidad) => especialidad.medicos)
  @JoinTable({
    name: "medico_especialidad", // usa la tabla intermedia que YA EXISTE en Supabase
    joinColumn: { name: "id_medico", referencedColumnName: "idMedico" },
    inverseJoinColumn: { name: "id_especialidad", referencedColumnName: "idEspecialidad" },
  })
  especialidades: Especialidad[];
}