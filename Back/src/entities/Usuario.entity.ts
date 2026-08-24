import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Rol } from "./Rol.entity";

@Entity({ name: "usuario" })
export class Usuario {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_usuario" })
  idUsuario: number;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { nullable: false })
  @JoinColumn({ name: "id_rol" })
  rol: Rol;

  @Column({ type: "varchar", length: 100 })
  nombres: string;

  @Column({ type: "varchar", length: 100 })
  apellidos: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  passwordHash: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn({ type: "timestamp", name: "fecha_creacion" })
  fechaCreacion: Date;
}