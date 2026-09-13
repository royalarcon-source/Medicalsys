# Documentación de Arquitectura y Diagramas UML — MedicalSys (Sprint 5)

Este documento contiene los tres diagramas principales del sistema **MedicalSys** estructurados en sintaxis **Mermaid**:

1. **Diagrama de Componentes (Arquitectura general)**
2. **Modelado UML (Diagrama de Clases del Dominio)**
3. **Diagrama de Tiempos y Secuencia (Ciclo de Vida con Cifrado HU-38 y Auditoría HU-39)**

---

## 1. Diagrama de Componentes (Component Diagram)

```mermaid
componentDiagram
    package "Capa de Presentación (Frontend - React + Vite)" {
        [React App / UI] as UI
        [AuthContext / Token Storage] as AuthCtx
        [API Services (Fetch Clients)] as APIClients
    }

    package "Capa de Aplicación y API (Backend - Node.js / Express 5)" {
        [Express Router / Endpoints] as Router
        
        package "Middlewares" {
            [authMiddleware / requirePermission] as AuthMw
            [errorHandler Middleware] as ErrorMw
            [Multer Upload Middleware] as UploadMw
        }
        
        package "Controladores (Controllers)" {
            [AuthController] as AuthCtrl
            [PacienteController] as PacienteCtrl
            [ConsultaController] as ConsultaCtrl
            [AuditLogController] as AuditCtrl
            [FacturaController] as FacturaCtrl
        }
        
        package "Servicios de Negocio (Services)" {
            [PacienteService] as PacienteSvc
            [ConsultaService] as ConsultaSvc
            [AuditLogService] as AuditSvc
            [AnuncioService] as AnuncioSvc
            [FacturaService] as FacturaSvc
        }

        package "Utilidades de Infraestructura" {
            [crypto / AES-256-GCM (encryption.ts)] as CryptoUtil
            [TypeORM ValueTransformer] as EncTransformer
        }
    }

    package "Capa de Persistencia e Infraestructura Externa" {
        [TypeORM DataSource / Repositories] as TypeORM
        database "PostgreSQL (Supabase DB)" as PostgresDB {
            [Tablas: paciente, consulta, audit_log, etc.] as Tables
        }
        cloud "Cloudinary API" as Cloudinary
    }

    UI --> AuthCtx
    UI --> APIClients
    APIClients --> Router : HTTP / REST (JSON + JWT)

    Router --> AuthMw
    AuthMw --> Router
    Router --> UploadMw
    Router --> AuthCtrl
    Router --> PacienteCtrl
    Router --> ConsultaCtrl
    Router --> AuditCtrl
    Router --> FacturaCtrl
    Router --> ErrorMw

    AuthCtrl --> AuditSvc
    PacienteCtrl --> PacienteSvc
    ConsultaCtrl --> ConsultaSvc
    AuditCtrl --> AuditSvc
    FacturaCtrl --> FacturaSvc

    PacienteSvc --> EncTransformer
    ConsultaSvc --> EncTransformer
    EncTransformer --> CryptoUtil
    ErrorMw --> AuditSvc : Log ERROR_INTERNO (500)

    PacienteSvc --> TypeORM
    ConsultaSvc --> TypeORM
    AuditSvc --> TypeORM
    FacturaSvc --> TypeORM
    TypeORM --> Tables : SQL Queries
    UploadMw --> Cloudinary : Subida de archivos
```

---

## 2. Modelado UML — Diagrama de Clases (Class Diagram)

```mermaid
classDiagram
    class Usuario {
        +bigint idUsuario
        +string nombres
        +string apellidos
        +string email
        +string passwordHash
        +string telefono
        +boolean activo
        +Date fechaRegistro
    }

    class Rol {
        +bigint idRol
        +string nombre
        +string descripcion
    }

    class Paciente {
        +bigint idPaciente
        +string documentoIdentidad
        +Date fechaNacimiento
        +string sexo
        +string direccion [Encrypted]
        +string contactoEmergencia [Encrypted]
        +string telefonoEmergencia [Encrypted]
        +Date fechaRegistro
    }

    class Medico {
        +bigint idMedico
        +string numeroLicencia
        +string telefonoProfesional
    }

    class Especialidad {
        +bigint idEspecialidad
        +string nombre
        +string descripcion
    }

    class HistoriaClinica {
        +bigint idHistoria
        +Date fechaApertura
        +string observaciones [Encrypted]
    }

    class Consulta {
        +bigint idConsulta
        +Date fechaConsulta
        +string motivo [Encrypted]
        +string anamnesis [Encrypted]
        +string examenFisico [Encrypted]
        +string observaciones [Encrypted]
        +string tipoIngreso
        +int numeroTurno
        +string estadoConsulta
    }

    class Diagnostico {
        +bigint idDiagnostico
        +string codigo
        +string descripcion [Encrypted]
        +string tipo
    }

    class Tratamiento {
        +bigint idTratamiento
        +string descripcion [Encrypted]
        +string indicaciones [Encrypted]
        +Date fechaInicio
        +Date fechaFin
    }

    class Cita {
        +bigint idCita
        +Date fechaHora
        +string estado
        +string motivo
    }

    class Factura {
        +bigint idFactura
        +string numeroFactura
        +Date fechaEmision
        +string nitCliente [Encrypted]
        +string razonSocial [Encrypted]
        +decimal subtotal
        +decimal impuestos
        +decimal total
        +string estado
        +string codigoControl
    }

    class AuditLog {
        +bigint idLog
        +bigint idUsuario
        +string rol
        +string accion
        +string entidad
        +bigint idEntidad
        +string ip
        +text userAgent
        +string resultado
        +text detalle
        +Date fechaHora
    }

    class Anuncio {
        +bigint idAnuncio
        +string titulo
        +text contenido
        +Date fechaPublicacion
        +Date fechaExpiracion
        +string estado
    }

    Usuario "1" -- "1" Rol : tiene >
    Paciente "0..1" -- "1" Usuario : asociado a >
    Medico "0..1" -- "1" Usuario : asociado a >
    Medico "*" -- "*" Especialidad : especialidades >
    HistoriaClinica "1" -- "1" Paciente : pertenece a >
    Consulta "*" -- "1" HistoriaClinica : registrada en >
    Consulta "*" -- "1" Medico : atendida por >
    Consulta "0..1" -- "0..1" Cita : vinculada a >
    Diagnostico "*" -- "1" Consulta : genera <
    Tratamiento "*" -- "1" Consulta : prescribe <
    Factura "*" -- "1" Paciente : facturada a >
    AuditLog "*" -- "0..1" Usuario : ejecutado por >
```

---

## 3. Diagrama de Tiempos y Secuencia (Timing / Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor MedicoUser as Médico (Frontend)
    participant Express as Express Router / Middleware
    participant Controller as ConsultaController
    participant Service as ConsultaService
    participant Encrypter as AES-256-GCM (encryption.ts)
    participant TypeORM as TypeORM / DB Driver
    participant Postgres as PostgreSQL (Supabase)
    participant AuditSvc as AuditLogService

    Note over MedicoUser, Postgres: ⏱️ T0: Envío de Petición HTTP POST /api/consultas
    MedicoUser->>Express: POST /api/consultas (JWT + Payload plano)
    
    Note over Express: ⏱️ T1: Autenticación y Autorización (JWT Check)
    Express->>Express: Validar JWT y Permiso "CONSULTA_CREAR"
    
    alt Token o Permiso Inválido
        Express-->>AuditSvc: auditLog.registrar("ACCESO_DENEGADO", 403)
        Express-->>MedicoUser: 403 Forbidden
    else Token Válido
        Express->>Controller: req.user + req.body
        Controller->>Service: crearConsulta(datos)
        
        Note over Service, Encrypter: ⏱️ T2: Transformación y Cifrado AES-256-GCM
        Service->>Encrypter: encrypt(anamnesis, examenFisico, motivo)
        Encrypter-->>Service: iv:authTag:ciphertext (hex)
        
        Note over Service, Postgres: ⏱️ T3: Inserción en Base de Datos
        Service->>TypeORM: save(ConsultaEntity)
        TypeORM->>Postgres: INSERT INTO consulta (motivo, anamnesis, ...) VALUES ('cifrado...', 'cifrado...')
        Postgres-->>TypeORM: OK (id_consulta: 105)
        TypeORM-->>Service: Consulta Guardada
        
        Note over Service, AuditSvc: ⏱️ T4: Auditoría Asíncrona (Fire-and-Forget)
        Service-)AuditSvc: AuditLogService.registrar("CONSULTA_CREAR", "EXITO")
        AuditSvc-)Postgres: INSERT INTO audit_log (...)
        
        Note over Service, MedicoUser: ⏱️ T5: Respuesta al Cliente (Descifrado transparente)
        Service-->>Controller: DTO Consulta
        Controller-->>MedicoUser: 201 Created (Payload JSON)
    end
```