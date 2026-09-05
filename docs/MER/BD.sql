-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.campana (
  id_campana bigint NOT NULL DEFAULT nextval('campana_id_campana_seq'::regclass),
  nombre character varying NOT NULL,
  descripcion text,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  estado character varying NOT NULL DEFAULT 'borrador'::character varying CHECK (estado::text = ANY (ARRAY['BORRADOR'::character varying, 'PROGRAMADA'::character varying, 'ACTIVA'::character varying, 'FINALIZADA'::character varying, 'CANCELADA'::character varying]::text[])),
  CONSTRAINT campana_pkey PRIMARY KEY (id_campana)
);
CREATE TABLE public.cita (
  id_cita bigint NOT NULL DEFAULT nextval('cita_id_cita_seq'::regclass),
  id_paciente bigint NOT NULL,
  id_medico bigint NOT NULL,
  id_consultorio bigint,
  fecha_hora_inicio timestamp without time zone NOT NULL,
  fecha_hora_fin timestamp without time zone NOT NULL,
  motivo character varying,
  estado character varying NOT NULL DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['PENDIENTE'::character varying, 'CONFIRMADA'::character varying, 'ATENDIDA'::character varying, 'CANCELADA'::character varying, 'NO_ASISTIO'::character varying]::text[])),
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cita_pkey PRIMARY KEY (id_cita),
  CONSTRAINT fk_7 FOREIGN KEY (id_paciente) REFERENCES public.paciente(id_paciente),
  CONSTRAINT fk_8 FOREIGN KEY (id_medico) REFERENCES public.medico(id_medico),
  CONSTRAINT fk_9 FOREIGN KEY (id_consultorio) REFERENCES public.consultorio(id_consultorio)
);
CREATE TABLE public.consentimiento (
  id_consentimiento bigint NOT NULL DEFAULT nextval('consentimiento_id_consentimiento_seq'::regclass),
  id_paciente bigint NOT NULL,
  id_documento bigint UNIQUE,
  id_consulta bigint,
  tipo character varying NOT NULL,
  version character varying NOT NULL,
  fecha_emision timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_firma timestamp without time zone,
  estado character varying NOT NULL DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['PENDIENTE'::character varying, 'FIRMADO'::character varying, 'REVOCADO'::character varying]::text[])),
  firmado_por character varying,
  CONSTRAINT consentimiento_pkey PRIMARY KEY (id_consentimiento),
  CONSTRAINT fk_18 FOREIGN KEY (id_paciente) REFERENCES public.paciente(id_paciente),
  CONSTRAINT fk_19 FOREIGN KEY (id_documento) REFERENCES public.documento(id_documento),
  CONSTRAINT consentimiento_consulta FOREIGN KEY (id_consulta) REFERENCES public.consulta(id_consulta)
);
CREATE TABLE public.consulta (
  id_consulta bigint NOT NULL DEFAULT nextval('consulta_id_consulta_seq'::regclass),
  id_historia bigint NOT NULL,
  id_medico bigint NOT NULL,
  id_cita bigint UNIQUE,
  id_consultorio bigint,
  fecha_consulta timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo text,
  anamnesis text,
  examen_fisico text,
  observaciones text,
  CONSTRAINT consulta_pkey PRIMARY KEY (id_consulta),
  CONSTRAINT fk_11 FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia),
  CONSTRAINT fk_12 FOREIGN KEY (id_medico) REFERENCES public.medico(id_medico),
  CONSTRAINT fk_13 FOREIGN KEY (id_cita) REFERENCES public.cita(id_cita),
  CONSTRAINT consulta_consultorio FOREIGN KEY (id_consultorio) REFERENCES public.consultorio(id_consultorio)
);
CREATE TABLE public.consultorio (
  id_consultorio bigint NOT NULL DEFAULT nextval('consultorio_id_consultorio_seq'::regclass),
  nombre character varying NOT NULL,
  tipo character varying NOT NULL,
  piso character varying,
  capacidad integer NOT NULL DEFAULT 1 CHECK (capacidad > 0),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT consultorio_pkey PRIMARY KEY (id_consultorio)
);
CREATE TABLE public.detalle_factura (
  id_detalle bigint NOT NULL DEFAULT nextval('detalle_factura_id_detalle_seq'::regclass),
  id_factura bigint NOT NULL,
  id_servicio bigint NOT NULL,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0::numeric),
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  CONSTRAINT detalle_factura_pkey PRIMARY KEY (id_detalle),
  CONSTRAINT fk_22 FOREIGN KEY (id_servicio) REFERENCES public.servicio(id_servicio),
  CONSTRAINT fk_21 FOREIGN KEY (id_factura) REFERENCES public.factura(id_factura)
);
CREATE TABLE public.diagnostico (
  id_diagnostico bigint NOT NULL DEFAULT nextval('diagnostico_id_diagnostico_seq'::regclass),
  id_consulta bigint NOT NULL,
  codigo character varying,
  descripcion character varying NOT NULL,
  tipo character varying,
  CONSTRAINT diagnostico_pkey PRIMARY KEY (id_diagnostico),
  CONSTRAINT fk_14 FOREIGN KEY (id_consulta) REFERENCES public.consulta(id_consulta)
);
CREATE TABLE public.documento (
  id_documento bigint NOT NULL DEFAULT nextval('documento_id_documento_seq'::regclass),
  id_paciente bigint NOT NULL,
  id_historia bigint,
  tipo character varying NOT NULL,
  nombre_archivo character varying NOT NULL,
  mime_type character varying NOT NULL,
  tamano_bytes bigint CHECK (tamano_bytes >= 0),
  storage_key character varying NOT NULL UNIQUE,
  hash_archivo character varying,
  fecha_subida timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT documento_pkey PRIMARY KEY (id_documento),
  CONSTRAINT fk_16 FOREIGN KEY (id_paciente) REFERENCES public.paciente(id_paciente),
  CONSTRAINT fk_17 FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia)
);
CREATE TABLE public.especialidad (
  id_especialidad bigint NOT NULL DEFAULT nextval('especialidad_id_especialidad_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion character varying,
  CONSTRAINT especialidad_pkey PRIMARY KEY (id_especialidad)
);
CREATE TABLE public.factura (
  id_factura bigint NOT NULL DEFAULT nextval('factura_id_factura_seq'::regclass),
  id_paciente bigint NOT NULL,
  numero_factura character varying UNIQUE,
  fecha_emision timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nit_cliente character varying,
  razon_social character varying,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0::numeric),
  impuestos numeric NOT NULL DEFAULT 0 CHECK (impuestos >= 0::numeric),
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0::numeric),
  estado character varying NOT NULL DEFAULT 'borrador'::character varying CHECK (estado::text = ANY (ARRAY['BORRADOR'::character varying, 'EMITIDA'::character varying, 'ANULADA'::character varying, 'PAGADA'::character varying]::text[])),
  codigo_control character varying,
  CONSTRAINT factura_pkey PRIMARY KEY (id_factura),
  CONSTRAINT fk_20 FOREIGN KEY (id_paciente) REFERENCES public.paciente(id_paciente)
);
CREATE TABLE public.historia_clinica (
  id_historia bigint NOT NULL DEFAULT nextval('historia_clinica_id_historia_seq'::regclass),
  id_paciente bigint NOT NULL UNIQUE,
  fecha_apertura timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones text,
  CONSTRAINT historia_clinica_pkey PRIMARY KEY (id_historia),
  CONSTRAINT fk_10 FOREIGN KEY (id_paciente) REFERENCES public.paciente(id_paciente)
);
CREATE TABLE public.horario_disponibilidad (
  id_horario bigint NOT NULL DEFAULT nextval('horario_disponibilidad_id_horario_seq'::regclass),
  id_medico bigint NOT NULL,
  dia_semana smallint NOT NULL CHECK (dia_semana >= 1 AND dia_semana <= 7),
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT horario_disponibilidad_pkey PRIMARY KEY (id_horario),
  CONSTRAINT fk_6 FOREIGN KEY (id_medico) REFERENCES public.medico(id_medico)
);
CREATE TABLE public.medico (
  id_medico bigint NOT NULL DEFAULT nextval('medico_id_medico_seq'::regclass),
  id_usuario bigint NOT NULL UNIQUE,
  numero_colegiatura character varying NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT medico_pkey PRIMARY KEY (id_medico),
  CONSTRAINT fk_3 FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.medico_especialidad (
  id_medico bigint NOT NULL,
  id_especialidad bigint NOT NULL,
  CONSTRAINT medico_especialidad_pkey PRIMARY KEY (id_medico, id_especialidad),
  CONSTRAINT fk_4 FOREIGN KEY (id_medico) REFERENCES public.medico(id_medico),
  CONSTRAINT fk_5 FOREIGN KEY (id_especialidad) REFERENCES public.especialidad(id_especialidad)
);
CREATE TABLE public.notificacion (
  id_notificacion bigint NOT NULL DEFAULT nextval('notificacion_id_notificacion_seq'::regclass),
  id_usuario bigint NOT NULL,
  id_cita bigint,
  canal character varying NOT NULL CHECK (canal::text = ANY (ARRAY['WHATSAPP'::character varying, 'EMAIL'::character varying, 'SMS'::character varying]::text[])),
  tipo character varying NOT NULL,
  mensaje text NOT NULL,
  estado character varying NOT NULL DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['PENDIENTE'::character varying, 'ENVIADA'::character varying, 'FALLIDA'::character varying, 'CANCELADA'::character varying]::text[])),
  fecha_programada timestamp without time zone,
  fecha_envio timestamp without time zone,
  CONSTRAINT notificacion_pkey PRIMARY KEY (id_notificacion),
  CONSTRAINT fk_23 FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario),
  CONSTRAINT fk_24 FOREIGN KEY (id_cita) REFERENCES public.cita(id_cita)
);
CREATE TABLE public.paciente (
  id_paciente bigint NOT NULL DEFAULT nextval('paciente_id_paciente_seq'::regclass),
  id_usuario bigint UNIQUE,
  documento_identidad character varying NOT NULL UNIQUE,
  fecha_nacimiento date NOT NULL,
  sexo character varying,
  direccion character varying,
  contacto_emergencia character varying,
  telefono_emergencia character varying,
  fecha_registro timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT paciente_pkey PRIMARY KEY (id_paciente),
  CONSTRAINT fk_2 FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.promocion (
  id_promocion bigint NOT NULL DEFAULT nextval('promocion_id_promocion_seq'::regclass),
  id_campana bigint NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  porcentaje_desc numeric CHECK (porcentaje_desc IS NULL OR porcentaje_desc >= 0::numeric AND porcentaje_desc <= 100::numeric),
  fecha_inicio date NOT NULL,
  fecha_fin date,
  activa boolean NOT NULL DEFAULT true,
  CONSTRAINT promocion_pkey PRIMARY KEY (id_promocion),
  CONSTRAINT promocion_campana FOREIGN KEY (id_campana) REFERENCES public.campana(id_campana)
);
CREATE TABLE public.rol (
  id_rol bigint NOT NULL DEFAULT nextval('rol_id_rol_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion character varying,
  CONSTRAINT rol_pkey PRIMARY KEY (id_rol)
);
CREATE TABLE public.servicio (
  id_servicio bigint NOT NULL DEFAULT nextval('servicio_id_servicio_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion character varying,
  precio numeric NOT NULL CHECK (precio >= 0::numeric),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT servicio_pkey PRIMARY KEY (id_servicio)
);
CREATE TABLE public.tratamiento (
  id_tratamiento bigint NOT NULL DEFAULT nextval('tratamiento_id_tratamiento_seq'::regclass),
  id_consulta bigint NOT NULL,
  descripcion text NOT NULL,
  indicaciones text,
  fecha_inicio date,
  fecha_fin date,
  CONSTRAINT tratamiento_pkey PRIMARY KEY (id_tratamiento),
  CONSTRAINT fk_15 FOREIGN KEY (id_consulta) REFERENCES public.consulta(id_consulta)
);
CREATE TABLE public.usuario (
  id_usuario bigint NOT NULL DEFAULT nextval('usuario_id_usuario_seq'::regclass),
  nombres character varying NOT NULL,
  apellidos character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  telefono character varying,
  activo boolean NOT NULL DEFAULT true,
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_rol bigint NOT NULL,
  CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT usuario_rol_fk FOREIGN KEY (id_rol) REFERENCES public.rol(id_rol)
);
CREATE TABLE public.migrations (
  id integer NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  timestamp bigint NOT NULL,
  name character varying NOT NULL,
  CONSTRAINT migrations_pkey PRIMARY KEY (id)
);0