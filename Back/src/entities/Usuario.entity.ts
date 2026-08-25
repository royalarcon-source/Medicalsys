import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Rol } from "./Rol.entity";

@Entity({ name: "usuario" })
export class Usuario {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id_usuario!: string;

  @Column({ type: "varchar", length: 100 })
  nombres!: string;

  @Column({ type: "varchar", length: 100 })
  apellidos!: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  password_hash!: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  telefono?: string;

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @CreateDateColumn({ type: "timestamp", name: "fecha_creacion" })
  fecha_creacion!: Date;

  @ManyToMany(() => Rol, (rol) => rol.usuarios, { eager: true })
  @JoinTable({
    name: "usuario_rol",
    joinColumn: { name: "id_usuario", referencedColumnName: "id_usuario" },
    inverseJoinColumn: { name: "id_rol", referencedColumnName: "id_rol" },
  })
  roles!: Rol[];
}
