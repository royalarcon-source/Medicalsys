import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Usuario } from "./Usuario.entity";

export enum RolNombre {
  ADMINISTRADOR = "ADMINISTRADOR",
  MEDICO = "MEDICO",
  RECEPCIONISTA = "RECEPCIONISTA",
  PACIENTE = "PACIENTE",
}

@Entity({ name: "rol" })
export class Rol {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_rol" })
  idRol: number;

  @Column({ type: "varchar", length: 30, unique: true })
  nombre: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  descripcion: string | null;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];
}
