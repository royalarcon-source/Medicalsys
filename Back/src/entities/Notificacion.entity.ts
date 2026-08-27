import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Usuario } from "./Usuario.entity";
import { Cita } from "./Cita.entity";

@Entity({ name: "notificacion" })
export class Notificacion {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_notificacion" })
  idNotificacion: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: "id_usuario" })
  usuario: Usuario;

  @ManyToOne(() => Cita, { nullable: true })
  @JoinColumn({ name: "id_cita" })
  cita: Cita | null;

  @Column({ type: "varchar", length: 30 })
  canal: "WHATSAPP" | "EMAIL" | "SMS";

  @Column({ type: "varchar", length: 50 })
  tipo: string;

  @Column({ type: "text" })
  mensaje: string;

  @Column({ type: "varchar", length: 30, default: "PENDIENTE" })
  estado: string; // PENDIENTE | ENVIADA | FALLIDA | CANCELADA

  @Column({ type: "timestamp", nullable: true, name: "fecha_programada" })
  fechaProgramada: Date | null;

  @Column({ type: "timestamp", nullable: true, name: "fecha_envio" })
  fechaEnvio: Date | null;
}