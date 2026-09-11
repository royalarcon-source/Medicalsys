import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Consulta } from "./Consulta.entity";
import { Paciente } from "./Paciente.entity";
import { Servicio } from "./Servicio.entity";
import { Factura } from "./Factura.entity";

export type EstadoAtencionServicio = "PENDIENTE" | "FACTURADO" | "CANCELADO";

@Entity({ name: "atencion_servicio" })
export class AtencionServicio {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_atencion_servicio" })
  idAtencionServicio: number;

  @ManyToOne(() => Consulta, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "id_consulta" })
  consulta: Consulta | null;

  @ManyToOne(() => Paciente, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_paciente" })
  paciente: Paciente;

  @ManyToOne(() => Servicio, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "id_servicio" })
  servicio: Servicio;

  @ManyToOne(() => Factura, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "id_factura" })
  factura: Factura | null;

  @Column({ type: "int", default: 1 })
  cantidad: number;

  @Column({ type: "numeric", precision: 12, scale: 2, name: "precio_unitario" })
  precioUnitario: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  observaciones: string | null;

  @Column({
    type: "varchar",
    length: 30,
    default: "PENDIENTE",
  })
  estado: EstadoAtencionServicio;

  @CreateDateColumn({ type: "timestamp", name: "fecha_registro" })
  fechaRegistro: Date;
}

