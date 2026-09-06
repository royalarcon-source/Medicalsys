import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "campana" })
export class Campana {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_campana" })
  idCampana: number;

  @Column({ type: "varchar", length: 150 })
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string | null;

  @Column({ type: "date", name: "fecha_inicio" })
  fechaInicio: Date;

  @Column({ type: "date", nullable: true, name: "fecha_fin" })
  fechaFin: Date | null;

  @Column({ type: "varchar", length: 30, default: "BORRADOR" })
  estado: string;
}