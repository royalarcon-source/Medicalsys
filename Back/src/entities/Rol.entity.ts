import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Usuario } from "./Usuario.entity";

export enum RolNombre {
  ADMINISTRADOR = "ADMINISTRADOR",
  MEDICO = "MEDICO",
  RECEPCIONISTA = "RECEPCIONISTA",
  PACIENTE = "PACIENTE",
}

@Entity({ name: "rol" })
export class Rol {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id_rol!: string;

  @Column({ type: "varchar", length: 30, unique: true })
  nombre!: RolNombre;

  @Column({ type: "varchar", length: 150, nullable: true })
  descripcion?: string;

  @ManyToMany(() => Usuario, (usuario) => usuario.roles)
  usuarios!: Usuario[];
}
