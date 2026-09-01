import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Campana } from "./Campana.entity";

@Entity({ name: "promocion" })
export class Promocion {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_promocion" })
  idPromocion: number;

  @ManyToOne(() => Campana, { nullable: false })
  @JoinColumn({ name: "id_campana" })
  campana: Campana;

  @Column({ type: "varchar", length: 150 })
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string | null;

  @Column({ type: "numeric", precision: 5, scale: 2, nullable: true, name: "porcentaje_desc" })
  porcentajeDesc: string | null;

  @Column({ type: "date", name: "fecha_inicio" })
  fechaInicio: Date;

  @Column({ type: "date", nullable: true, name: "fecha_fin" })
  fechaFin: Date | null;

  @Column({ type: "boolean", default: true })
  activa: boolean;
}