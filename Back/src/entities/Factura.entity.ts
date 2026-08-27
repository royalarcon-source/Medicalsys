import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";

@Entity({ name: "factura" })
export class Factura {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_factura" })
  idFactura: number;

  @ManyToOne(() => Paciente, { nullable: false })
  @JoinColumn({ name: "id_paciente" })
  paciente: Paciente;

  @Column({ type: "varchar", length: 50, unique: true, nullable: true, name: "numero_factura" })
  numeroFactura: string | null;

  @CreateDateColumn({ type: "timestamp", name: "fecha_emision" })
  fechaEmision: Date;

  @Column({ type: "varchar", length: 30, nullable: true, name: "nit_cliente" })
  nitCliente: string | null;

  @Column({ type: "varchar", length: 200, nullable: true, name: "razon_social" })
  razonSocial: string | null;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  impuestos: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  total: string;

  @Column({ type: "varchar", length: 30, default: "BORRADOR" })
  estado: string; // BORRADOR | EMITIDA | ANULADA | PAGADA

  @Column({ type: "varchar", length: 100, nullable: true, name: "codigo_control" })
  codigoControl: string | null; // lo devuelve el SIN al validar (HU-31)
}