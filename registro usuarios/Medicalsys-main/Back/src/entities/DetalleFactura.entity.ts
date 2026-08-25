import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Factura } from "./Factura.entity";
import { Servicio } from "./Servicio.entity";

@Entity({ name: "detalle_factura" })
export class DetalleFactura {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_detalle" })
  idDetalle: number;

  @ManyToOne(() => Factura, { nullable: false })
  @JoinColumn({ name: "id_factura" })
  factura: Factura;

  @ManyToOne(() => Servicio, { nullable: false })
  @JoinColumn({ name: "id_servicio" })
  servicio: Servicio;

  @Column({ type: "int", default: 1 })
  cantidad: number;

  @Column({ type: "numeric", precision: 12, scale: 2, name: "precio_unitario" })
  precioUnitario: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  subtotal: string;
}