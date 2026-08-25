import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Usuario } from "./Usuario.entity";

@Entity({ name: "paciente" })
export class Paciente {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_paciente" })
  idPaciente: number;

  @OneToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "id_usuario" })
  usuario: Usuario | null;

  @Column({ type: "varchar", length: 30, unique: true, name: "documento_identidad" })
  documentoIdentidad: string;

  @Column({ type: "date", name: "fecha_nacimiento" })
  fechaNacimiento: Date;

  @Column({ type: "varchar", length: 20, nullable: true })
  sexo: string | null;

  @Column({ type: "varchar", length: 250, nullable: true })
  direccion: string | null;

  @Column({ type: "varchar", length: 150, nullable: true, name: "contacto_emergencia" })
  contactoEmergencia: string | null;

  @Column({ type: "varchar", length: 30, nullable: true, name: "telefono_emergencia" })
  telefonoEmergencia: string | null;

  @CreateDateColumn({ type: "timestamp", name: "fecha_registro" })
  fechaRegistro: Date;
}