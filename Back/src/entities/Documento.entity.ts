import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";
import { HistoriaClinica } from "./HistoriaClinica.entity";

@Entity({ name: "documento" })
export class Documento {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_documento" })
  idDocumento: number;

  @ManyToOne(() => Paciente, { nullable: false })
  @JoinColumn({ name: "id_paciente" })
  paciente: Paciente;

  @ManyToOne(() => HistoriaClinica, { nullable: true })
  @JoinColumn({ name: "id_historia" })
  historia: HistoriaClinica | null;

  @Column({ type: "varchar", length: 50 })
  tipo: string;

  @Column({ type: "varchar", length: 255, name: "nombre_archivo" })
  nombreArchivo: string;

  @Column({ type: "varchar", length: 100, name: "mime_type" })
  mimeType: string;

  @Column({ type: "bigint", nullable: true, name: "tamano_bytes" })
  tamanoBytes: number | null;

  @Column({ type: "varchar", length: 1000, unique: true, name: "storage_key" })
  storageKey: string; // referencia al objeto en Blob Storage (S3/R2), NO el archivo en sí

  @Column({ type: "varchar", length: 128, nullable: true, name: "hash_archivo" })
  hashArchivo: string | null;

  @CreateDateColumn({ type: "timestamp", name: "fecha_subida" })
  fechaSubida: Date;

  @Column({ type: "boolean", default: true })
  activo: boolean;
}