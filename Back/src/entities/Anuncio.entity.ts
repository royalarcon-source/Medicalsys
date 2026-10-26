import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "anuncio" })
export class Anuncio {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_anuncio" })
  idAnuncio: number;

  @Column({ type: "varchar", length: 150 })
  titulo: string;

  @Column({ type: "text" })
  contenido: string;

  @Column({ type: "date", nullable: true, name: "fecha_publicacion" })
  fechaPublicacion: Date | null;

  @Column({ type: "date", nullable: true, name: "fecha_expiracion" })
  fechaExpiracion: Date | null;

  @Column({ type: "varchar", length: 30, default: "BORRADOR" })
  estado: string;
}
