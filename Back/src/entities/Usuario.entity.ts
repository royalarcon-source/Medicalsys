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

  // select: false — nunca se trae por default (evita filtrarlo en endpoints
  // que hidratan la relación usuario, como GET /medicos/:id). Para login
  // (HU-06) hay que pedirlo explícito con .addSelect("usuario.password_hash").
  @Column({ type: "varchar", length: 255, name: "password_hash", select: false })
  passwordHash: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn({ type: "timestamp", name: "fecha_creacion" })
  fechaCreacion: Date;
}