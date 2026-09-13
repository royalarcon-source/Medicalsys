import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

/**
 * HU-39: Registro de auditoría de operaciones sensibles del sistema.
 * Cada fila representa un evento auditado (login, acceso, modificación, error, etc.).
 */
@Entity({ name: "audit_log" })
export class AuditLog {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id_log" })
  idLog: number;

  /** ID del usuario que ejecutó la acción. NULL si el acceso fue anónimo o pre-autenticación. */
  @Column({ type: "bigint", nullable: true, name: "id_usuario" })
  idUsuario: number | null;

  /** Rol del usuario en el momento del evento. */
  @Column({ type: "varchar", length: 30, nullable: true })
  rol: string | null;

  /**
   * Código de la acción realizada.
   * Ejemplos: LOGIN_OK, LOGIN_FAIL, CONSULTA_CREAR, DOCUMENTO_VER, ACCESO_DENEGADO
   */
  @Column({ type: "varchar", length: 100 })
  accion: string;

  /**
   * Nombre de la entidad de dominio afectada, si aplica.
   * Ejemplos: Consulta, Paciente, Factura, Documento
   */
  @Column({ type: "varchar", length: 50, nullable: true })
  entidad: string | null;

  /** ID del registro de la entidad afectada, si aplica. */
  @Column({ type: "bigint", nullable: true, name: "id_entidad" })
  idEntidad: number | null;

  /** Dirección IP del cliente (IPv4 o IPv6). */
  @Column({ type: "varchar", length: 45, nullable: true })
  ip: string | null;

  /** User-Agent del cliente HTTP. */
  @Column({ type: "text", nullable: true, name: "user_agent" })
  userAgent: string | null;

  /**
   * Resultado del evento.
   * Valores posibles: EXITO | ERROR | ACCESO_DENEGADO
   */
  @Column({ type: "varchar", length: 20 })
  resultado: string;

  /**
   * Información adicional en formato JSON (texto plano).
   * Puede incluir: mensaje de error, campos modificados, parámetros relevantes, etc.
   */
  @Column({ type: "text", nullable: true })
  detalle: string | null;

  /** Timestamp automático del momento del evento. */
  @CreateDateColumn({ type: "timestamp", name: "fecha_hora" })
  fechaHora: Date;
}
